export interface DemandContentBlock {kind:'slide'|'scene'|'visual'|'caption'|'text';label:string;body:string}
export function parseDemandContent(value:string,title='') {
  // Presentation only: the original description is never rewritten or summarized.
  let text=value.replace(/\r\n/g,'\n').replace(/\\n/g,'\n');
  const marker=/^\s*(post|carousel|carrossel|reels)\s*\n/i.exec(text);
  const format=marker?.[1].toLowerCase();
  if(marker)text=text.slice(marker[0].length);
  // Explicit inline scene headings used by manual scripts become readable blocks.
  text=text.replace(/([.!?]) +(?=Cena \d+(?:\s*\(|\s*,|\s*:))/gi,'$1\n');
  const headings=/^(L[aâ]mina \d+|Slide \d+|Cena \d+(?:\s*(?:\([^\n)]{1,60}\)|,\s*[^:\n]{1,60}))?|Direção (?:visual(?: geral)?|criativa)|Título|CTA|Hashtags|Ângulo e enquadramento|Legenda(?: completa)?|Texto da arte|Texto de apoio|Apoio|Composição|Roteiro técnico)\s*:\s*/gim;
  const matches=[...text.matchAll(headings)];
  const intro=(matches.length?text.slice(0,matches[0].index):text).trim();
  const blocks:DemandContentBlock[]=matches.map((match,index)=>{
    const label=match[1],lower=label.toLowerCase();
    const kind= /^(l[aâ]mina|slide)/i.test(label)?'slide':/^cena/i.test(label)?'scene':lower.startsWith('direção')||lower==='composição'?'visual':lower.startsWith('legenda')?'caption':'text';
    return {kind,label:label.replace(/^Slide/i,'Lâmina'),body:text.slice(match.index!+match[0].length,matches[index+1]?.index??text.length).trim()};
  });
  const kind=format==='carousel'||format==='carrossel'||blocks.some(b=>b.kind==='slide')?'Carrossel':format==='reels'||blocks.some(b=>b.kind==='scene')||title.startsWith('[Videomaker]')?'Roteiro':format==='post'?'Post':'Conteúdo';
  return {kind,intro,blocks};
}
