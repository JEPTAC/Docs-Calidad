/* V84 · corrección estructural de numeración OOXML multinivel.
   Mantiene cada nivel en start-1 hasta su primera aparición para que, por ejemplo,
   un esquema con nivel 0 iniciado en 3 y nivel 1 iniciado en 1 produzca 3.1, no 3.2.
*/
const v84NumberLabelPrevious=v84NumberLabel;
v84NumberLabel=function(numId,ilvl,numbering,state){
  if(!numId)return null;
  const aid=numbering.nums.get(String(numId)),levels=numbering.abstracts.get(String(aid));
  if(!levels)return null;
  const lv=Number(ilvl)||0,level=levels.get(lv);
  if(!level)return null;
  if(level.fmt==='bullet')return{kind:'bullet',label:level.text||'•',level:lv};
  let counters=state.get(String(numId));
  if(!counters){
    counters=Array.from({length:9},(_,i)=>(levels.get(i)?.start||1)-1);
    state.set(String(numId),counters);
  }
  const ownStart=level.start||1;
  counters[lv]=(Number.isFinite(counters[lv])?counters[lv]:ownStart-1)+1;
  for(let i=lv+1;i<counters.length;i++)counters[i]=(levels.get(i)?.start||1)-1;
  let label=level.text||`%${lv+1}`;
  for(let i=0;i<9;i++){
    const spec=levels.get(i),start=spec?.start||1;
    let value=counters[i];
    if(!Number.isFinite(value)||value<start)value=start;
    label=label.replaceAll(`%${i+1}`,v84FmtNum(value,spec?.fmt||'decimal'));
  }
  return{kind:'number',label,level:lv,fmt:level.fmt};
};
window.EI_AI_V84_NUMBERING_READY=true;
