export const PROFILE_FIELDS = [
 {key:'meta_ad_account_id',label:'Conta Meta Ads (act_ID)',section:'Links'},
 {key:'niche',label:'Nicho',section:'Negócio'}, {key:'city',label:'Cidade',section:'Negócio'},
 {key:'instagram',label:'Instagram',section:'Links'}, {key:'plan',label:'Plano',section:'Negócio'},
 {key:'average_ticket',label:'Ticket médio',section:'Negócio',type:'number'},
 {key:'monthly_content_count',label:'Conteúdos por mês',section:'Direção editorial',type:'number'},
 {key:'target_audience',label:'Público-alvo',section:'Audiência'}, {key:'age_range',label:'Faixa etária',section:'Audiência'},
 {key:'audience_gender',label:'Gênero do público',section:'Audiência'}, {key:'tone',label:'Tom de comunicação',section:'Direção editorial'},
 {key:'differential',label:'Diferencial',section:'Posicionamento'}, {key:'positioning',label:'Posicionamento',section:'Posicionamento'},
 {key:'structure',label:'Estrutura',section:'Posicionamento'}, {key:'monthly_objective',label:'Objetivo do mês',section:'Direção editorial'},
 {key:'special_dates',label:'Datas especiais',section:'Direção editorial'}, {key:'renewal_date',label:'Data de renovação',section:'Negócio',type:'date'},
 {key:'drive_url',label:'Link do Drive',section:'Links'}, {key:'maps_url',label:'Link do Google Maps',section:'Links'},
 {key:'source_id',label:'ID na plataforma antiga',section:'Origem'},
 {key:'source_created_at',label:'Cadastrado na origem',section:'Origem'}, {key:'source_updated_at',label:'Atualizado na origem',section:'Origem'},
] as const;
export const PROFILE_LABELS = Object.fromEntries(PROFILE_FIELDS.map(f=>[f.key,f.label]));
