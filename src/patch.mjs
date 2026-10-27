export function bounded(text,label,max=100000){
 if(typeof text!=='string'||text.length>max||text.includes('\r')||text.includes('\0'))throw new Error(label+' must be LF-only text up to '+max+' UTF-16 units, without NUL.');
 if(text.split('\n').length>5001)throw new Error(label+' must be at most 5,000 lines.');
 return text;
}
export const offset=(start,count)=>count===0?start:start-1;
export function parsePatch(text){
 bounded(text,'Patch');const lines=text.split('\n');if(lines.at(-1)==='')lines.pop();let i=0;
 if(lines[i]?.startsWith('diff --git ')){i++;if(lines[i]?.startsWith('index '))i++;}
 if(!lines[i]?.startsWith('--- ')||!lines[i+1]?.startsWith('+++ '))throw new Error('Use one unified diff with paired --- and +++ file headers.');
 const oldFile=lines[i++].slice(4),newFile=lines[i++].slice(4);if(!oldFile||!newFile)throw new Error('File header labels cannot be empty.');
 const hunks=[];let lastEnd=0;
 while(i<lines.length){
  const match=/^@@ -(\d{1,6})(?:,(\d{1,6}))? \+(\d{1,6})(?:,(\d{1,6}))? @@(?: .*)?$/.exec(lines[i]);
  if(!match)throw new Error('Patch line '+(i+1)+': expected a hunk header. Multi-file, binary, mode and rename patches are unsupported.');
  const h={oldStart:Number(match[1]),oldCount:Number(match[2]??1),newStart:Number(match[3]),newCount:Number(match[4]??1),patchLine:i+1,lines:[]};i++;
  if((h.oldCount&&h.oldStart===0)||(h.newCount&&h.newStart===0)||(!h.oldCount&&!h.newCount))throw new Error('Hunk ranges must address real lines or an insertion/deletion boundary.');
  if(offset(h.oldStart,h.oldCount)<lastEnd)throw new Error('Hunks must be ordered and must not overlap in the original.');
  let old=0,next=0;
  while(old<h.oldCount||next<h.newCount){
   const line=lines[i];if(line===undefined||![' ','-','+'].includes(line[0]))throw new Error('Patch line '+(i+1)+': hunk body ended before its declared counts.');
   const entry={kind:line[0],text:line.slice(1),noNewline:false};h.lines.push(entry);i++;
   if(entry.kind!=='+')old++;if(entry.kind!=='-')next++;
   if(old>h.oldCount||next>h.newCount)throw new Error('Hunk body exceeds its declared line counts.');
   if(lines[i]==='\\ No newline at end of file'){entry.noNewline=true;i++;}
  }
  lastEnd=offset(h.oldStart,h.oldCount)+h.oldCount;hunks.push(h);if(hunks.length>100)throw new Error('Use at most 100 hunks.');
 }
 if(!hunks.length)throw new Error('Add at least one nonempty hunk.');
 return {format:'hunkwell-patch-v1',oldFile,newFile,hunks};
}
