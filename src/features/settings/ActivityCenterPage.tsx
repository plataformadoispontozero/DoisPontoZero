import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useActivityFeed } from './hooks/useAgencySettings'
import { Activity, Clock, ShieldCheck, FileCheck2, FolderKanban, FileText, Compass, Calendar, Settings } from 'lucide-react'

// Icon mapper for event types
const getEventIcon = (type: string) => {
  if (type.startsWith('proposals')) return <FileCheck2 className="w-4 h-4 text-[#B8FF65]" />
  if (type.startsWith('projects') || type.startsWith('tasks')) return <FolderKanban className="w-4 h-4 text-[#7952FF]" />
  if (type.startsWith('briefings')) return <FileText className="w-4 h-4 text-blue-400" />
  if (type.startsWith('strategy')) return <Compass className="w-4 h-4 text-amber-400" />
  if (type.startsWith('meetings')) return <Calendar className="w-4 h-4 text-emerald-400" />
  return <Settings className="w-4 h-4 text-[#A1A1B0]" />
}

export const ActivityCenterPage: React.FC = () => {
  const { data: events = [], isLoading } = useActivityFeed()

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-lg font-bold text-[#F8F9FC] flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#7952FF]" />
          Central de Atividades Operacionais
        </h3>
        <p className="text-xs text-[#A1A1B0]">
          Trilha de auditoria em tempo real das ações e modificações realizadas no workspace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#B8FF65]" />
            Feed de Eventos Auditados
          </CardTitle>
          <CardDescription className="text-xs">
            Eventos operacionais capturados das entidades autorizadas do banco de dados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center text-xs text-[#717182]">Carregando histórico...</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#717182]">
              Nenhuma atividade recente registrada.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#30303B]">
              {events.map((event) => (
                <div key={event.id} className="relative group">
                  {/* Ponto da linha do tempo */}
                  <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-[#101014] border border-[#30303B] flex items-center justify-center">
                    {getEventIcon(event.event_type)}
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#101014]/80 border border-[#30303B] hover:border-[#7952FF]/50 transition-colors text-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar src={event.actor_avatar} name={event.actor_name} size="sm" />
                        <span className="font-bold text-[#F8F9FC]">{event.actor_name}</span>
                        <Badge variant="outline" className="text-[9px] font-mono py-0">
                          {event.resource_type}
                        </Badge>
                      </div>

                      <span className="text-[10px] text-[#717182] font-mono">
                        {new Date(event.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <p className="text-[#A1A1B0] leading-relaxed text-xs">{event.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
