import {parsePatch,bounded} from './patch.mjs';import {applyStrict,reversePatch} from './apply.mjs';
export const EXAMPLE={source:'title=Field notes\ntheme=paper\nitems=6\n',patch:'--- a/settings.txt\n+++ b/settings.txt\n@@ -1,3 +1,4 @@\n title=Field notes\n-theme=paper\n+theme=mint\n items=6\n+preview=true\n',direction:'forward'};
export function inspect(source,text,direction='forward'){
 bounded(source,'Source');if(!['forward','reverse'].includes(direction))throw new Error('Choose forward or reverse.');
 const original=parsePatch(text),patch=direction==='reverse'?reversePatch(original):original,result=applyStrict(source,patch);
 const reverseVerified=result.ok?applyStrict(result.output,reversePatch(patch)).output===source:false;
 return {format:'hunkwell-report-v1',direction,oldFile:patch.oldFile,newFile:patch.newFile,hunks:patch.hunks.map(h=>({oldStart:h.oldStart,oldCount:h.oldCount,newStart:h.newStart,newCount:h.newCount,added:h.lines.filter(l=>l.kind==='+').length,removed:h.lines.filter(l=>l.kind==='-').length})),...result,reverseVerified};
}
export function projectJSON(source,patch,direction){bounded(source,'Source');parsePatch(patch);if(!['forward','reverse'].includes(direction))throw new Error('Choose forward or reverse.');return JSON.stringify({format:'hunkwell-project-v1',source,patch,direction},null,2)+'\n';}
export function parseProject(text){if(typeof text!=='string'||text.length>600000)throw new Error('Project JSON must be at most 600,000 UTF-16 units.');let p;try{p=JSON.parse(text);}catch{throw new Error('Project is not valid JSON.');}if(p?.format!=='hunkwell-project-v1')throw new Error('Not a Hunkwell project.');projectJSON(p.source,p.patch,p.direction);return {source:p.source,patch:p.patch,direction:p.direction};}
export const reportJSON=report=>JSON.stringify(report,null,2)+'\n';
