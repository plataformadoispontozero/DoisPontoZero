use std::{
    fs,
    path::PathBuf,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
        Mutex,
    },
    thread,
    time::Duration,
};
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Emitter, Listener, Manager, Wry,
};

struct DesktopState {
    keep_running: AtomicBool,
    online: AtomicBool,
    connected: AtomicBool,
    microphone: AtomicBool,
    camera: AtomicBool,
    quit_ready: Arc<AtomicBool>,
    status: Mutex<Option<MenuItem<Wry>>>,
    mute: Mutex<Option<MenuItem<Wry>>>,
    keep: Mutex<Option<CheckMenuItem<Wry>>>,
}

fn preference_path(app: &AppHandle) -> Option<PathBuf> {
    app.path().app_config_dir().ok().map(|path| path.join("desktop-preferences"))
}

fn load_keep_running(app: &AppHandle) -> bool {
    preference_path(app)
        .and_then(|path| fs::read_to_string(path).ok())
        .map(|value| value.trim() == "keep_running=true")
        .unwrap_or(false)
}

fn save_keep_running(app: &AppHandle, enabled: bool) {
    let Some(path) = preference_path(app) else { return };
    if let Some(parent) = path.parent() {
        if fs::create_dir_all(parent).is_err() { return; }
    }
    let _ = fs::write(path, if enabled { "keep_running=true\n" } else { "keep_running=false\n" });
}

#[tauri::command]
fn update_tray_status(app: AppHandle, connected: bool, microphone: bool, camera: bool) {
    if let Some(state) = app.try_state::<DesktopState>() {
        state.connected.store(connected, Ordering::Relaxed);
        state.microphone.store(microphone, Ordering::Relaxed);
        state.camera.store(camera, Ordering::Relaxed);
        render_tray_status(&state);
    }
}

#[tauri::command]
fn update_tray_presence(app: AppHandle, online: bool) {
    if let Some(state) = app.try_state::<DesktopState>() {
        state.online.store(online, Ordering::Relaxed);
        render_tray_status(&state);
    }
}

fn render_tray_status(state: &DesktopState) {
        if let Ok(status) = state.status.lock() {
            if let Some(item) = status.as_ref() {
                let online = if state.online.load(Ordering::Relaxed) { "online" } else { "offline" };
                let connection = if state.connected.load(Ordering::Relaxed) { "conectada" } else { "desconectada" };
                let mic = if state.microphone.load(Ordering::Relaxed) { "ligado" } else { "desligado" };
                let cam = if state.camera.load(Ordering::Relaxed) { "ligada" } else { "desligada" };
                let _ = item.set_text(format!("Presença: {online} · voz: {connection} · mic {mic} · câmera {cam}"));
            }
        }
        if let Ok(mute) = state.mute.lock() {
            if let Some(item) = mute.as_ref() {
                let connected = state.connected.load(Ordering::Relaxed);
                let _ = item.set_enabled(connected);
                let _ = item.set_text(if state.microphone.load(Ordering::Relaxed) { "Desativar microfone" } else { "Ativar microfone" });
            }
        }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .manage(DesktopState {
            keep_running: AtomicBool::new(false),
            online: AtomicBool::new(false),
            connected: AtomicBool::new(false),
            microphone: AtomicBool::new(false),
            camera: AtomicBool::new(false),
            quit_ready: Arc::new(AtomicBool::new(false)),
            status: Mutex::new(None),
            mute: Mutex::new(None),
            keep: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![update_tray_status, update_tray_presence])
        .setup(|app| {
            let keep_running = load_keep_running(&app.handle());
            app.state::<DesktopState>().keep_running.store(keep_running, Ordering::Relaxed);
            let quit_ready = app.state::<DesktopState>().quit_ready.clone();
            app.listen("office-tray-quit-ready", move |_| quit_ready.store(true, Ordering::Relaxed));

            let show = MenuItem::with_id(app, "show", "Mostrar Escritório", true, None::<&str>)?;
            let status = MenuItem::with_id(app, "status", "Presença: offline · voz: desconectada · mic desligado · câmera desligada", false, None::<&str>)?;
            let mute = MenuItem::with_id(app, "mute", "Ativar microfone", false, None::<&str>)?;
            let leave = MenuItem::with_id(app, "leave", "Sair do Escritório", true, None::<&str>)?;
            let keep = CheckMenuItem::with_id(app, "keep-running", "Manter aberto na bandeja ao fechar/minimizar", true, keep_running, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Encerrar Dois.Zero", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &status, &mute, &leave, &keep, &quit])?;
            if let Ok(mut item) = app.state::<DesktopState>().status.lock() { *item = Some(status); }
            if let Ok(mut item) = app.state::<DesktopState>().mute.lock() { *item = Some(mute); }
            if let Ok(mut item) = app.state::<DesktopState>().keep.lock() { *item = Some(keep); }

            let icon = tauri::image::Image::from_bytes(include_bytes!("../../public/app-icons/icon-192.png"))?;
            TrayIconBuilder::with_id("doiszero-office")
                .icon(icon)
                .tooltip("Dois.Zero — Escritório Digital")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "mute" => { let _ = app.emit("office-tray-mute-toggle", ()); }
                    "leave" => { let _ = app.emit("office-tray-leave", ()); }
                    "quit" => {
                        if let Some(state) = app.try_state::<DesktopState>() { state.quit_ready.store(false, Ordering::Relaxed); }
                        let _ = app.emit("office-tray-quit", ());
                        let handle = app.clone();
                        thread::spawn(move || {
                            for _ in 0..50 {
                                thread::sleep(Duration::from_millis(100));
                                if handle.try_state::<DesktopState>().map(|state| state.quit_ready.load(Ordering::Relaxed)).unwrap_or(false) { break; }
                            }
                            handle.exit(0);
                        });
                    }
                    "keep-running" => {
                        if let Some(state) = app.try_state::<DesktopState>() {
                            let next = !state.keep_running.load(Ordering::Relaxed);
                            state.keep_running.store(next, Ordering::Relaxed);
                            save_keep_running(app, next);
                            if let Ok(item) = state.keep.lock() {
                                if let Some(menu_item) = item.as_ref() { let _ = menu_item.set_checked(next); }
                            }
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            if let Some(window) = app.get_webview_window("main") {
                let handle = app.handle().clone();
                let event_window = window.clone();
                window.on_window_event(move |event| {
                    if let Some(state) = handle.try_state::<DesktopState>() {
                        if !state.keep_running.load(Ordering::Relaxed) { return; }
                        match event {
                            tauri::WindowEvent::CloseRequested { api, .. } => {
                                api.prevent_close();
                                let _ = event_window.hide();
                            }
                            tauri::WindowEvent::Resized(_) => {
                                if event_window.is_minimized().unwrap_or(false) { let _ = event_window.hide(); }
                            }
                            _ => {}
                        }
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Não foi possível iniciar o workspace Dois.Zero");
}
