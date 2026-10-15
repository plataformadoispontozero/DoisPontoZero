"""Merge controlled test reports by identity; never count retries as new coverage."""
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import json,re,sys

def browser_cases(report):
 out=[]
 def visit(suite):
  for spec in suite.get('specs',[]):
   for test in spec.get('tests',[]):
    result=(test.get('results') or [{}])[-1]
    out.append({'file':Path(spec['file']).name,'title':spec['title'],'project':test['projectName'],'status':result.get('status','missing')})
  for child in suite.get('suites',[]):visit(child)
 for suite in report.get('suites',[]):visit(suite)
 return out

if len(sys.argv)<3:raise SystemExit('Usage: phase-test-matrix.py UNIT.json BASELINE.json [RETEST.json ...]')
unit=json.loads(Path(sys.argv[1]).read_text());merged={}
for report_path in sys.argv[2:]:
 for case in browser_cases(json.loads(Path(report_path).read_text())):
  key=(case['file'],case['title'],case['project']);merged[key]=case
failed=[case for case in merged.values() if case['status'] not in ('passed','skipped')]
if unit['numFailedTests'] or failed:
 print(json.dumps({'unit_failures':unit['numFailedTests'],'browser_failures':failed},ensure_ascii=False,indent=2));raise SystemExit(1)
passed=[case for case in merged.values() if case['status']=='passed']
patterns={
 'phase-01':(r'/components/|/dashboard/|/router/|/config/',r'authenticated route refresh|grouped navigation|public home|mobile menu'),
 'phase-02':(r'/auth/|/team/|permission-studio|google-oauth-database',r'login|unauthenticated|viewer cannot|invalid.*session|inactive membership|backend unavailable|team.*permission|invitation|invite acceptance|member cannot|revokes aggregate'),
 'phase-03':(r'/clients/|import-clients/',r'client form|tenant switch|client assignments|CSV|Portuguese client|changing agency|client journey'),
 'phase-04':(r'/projects/|/tasks/|/production/',r'production|Kanban|management|Tasks starts|drag|reads a complete carousel|reads script scenes'),
 'phase-05':(r'/squads/|/team/|birthday-job',r'profile without photo|team routes|invitation'),
 'phase-06':(r'/briefing/|/pdf/',r'briefing|briefings|PDF'),
 'phase-07':(r'/editorial/|/strategy/|/social-media/',r'editorial|generator|calendar requires reviewed|generation save|Social Media|social media|social workflow|creates complete creative copy'),
 'phase-08':(r'/retired/|legacy-conversion|proposal',r'retired.*proposal|old public proposal'),
 'phase-09':(r'/drive/|/integrations/|/presentations/|/pdf/',r'Drive|presentation|PDF|Meta|briefing mirror'),
 'phase-10':(r'/meetings/|/chat/|/notifications/|/calendar/',r'work room|work rooms|notifications|operational events|personal agenda|notification sounds|meetings/new'),
 'phase-11':(r'/settings/|/public-site/|/app-install/|branding',r'settings|agency identity|Google|CSV|sound|owner can edit a local draft|viewer cannot enter public site'),
 'phase-12':(r'/platform/|/auth/|/router/|releaseEvidence|appRuntime|serviceWorker',r'.'),
}
old=json.loads(Path('docs/PLATFORM_HOMOLOGATION_STATUS.json').read_text());phases=[]
for phase in old['phases']:
 up,bp=patterns[phase['id']]
 files=[result for result in unit['testResults'] if re.search(up,result['name'])]
 unit_count=sum(sum(a['status']=='passed' for a in result['assertionResults']) for result in files)
 cases=[case for case in passed if re.search(bp,case['title'],re.I)]
 if unit_count==0 or len(cases)==0:raise SystemExit('Missing coverage for '+phase['id'])
 phases.append({**phase,'status':'removed_verified' if phase['id']=='phase-08' else 'verified','unit_tests':unit_count,'browser_tests':len(cases),'unit_files':[Path(r['name']).relative_to(Path.cwd()).as_posix() for r in files],'browser_cases':cases,'evidence':'docs/qa/platform-homologation-2026-10-14.md'})
result={**old,'status':'verified','verified_at':datetime.now(ZoneInfo('Europe/Paris')).isoformat(),'phases':phases,'checks':{'unit':{'passed':unit['numPassedTests'],'files':len(unit['testResults'])},'browser':{'passed':len(passed),'skipped':len(merged)-len(passed),'projects':sorted(set(c['project'] for c in passed))},'scope':'controlled_API_and_PGlite_not_live_external_services'},'source_reports':sys.argv[1:]}
Path('docs/PLATFORM_HOMOLOGATION_STATUS.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result['checks'],ensure_ascii=False))
