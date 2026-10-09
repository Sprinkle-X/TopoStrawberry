'use strict';

// Regenerate only the composition figure from the final split annotations.
const fs = require('fs');
const path = require('path');
const root = process.argv[2];
if (!root) throw new Error('Usage: node scripts/render-distributions.js <dataset-root>');
const splits = ['train', 'val', 'test'].map((split, i) => {
    const data = JSON.parse(fs.readFileSync(path.join(root, 'annotations', `strawberry_keypoints_${split}.json`), 'utf8'));
    return { label: ['Train', 'Validation', 'Test'][i], ...data };
});
const annotations = splits.flatMap(s => s.annotations);
const count = values => values.reduce((out, value) => { out[value] = (out[value] || 0) + 1; return out; }, {});
const n = value => value.toLocaleString('en-US');
const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const colors = { navy: '#17364d', blue: '#2b6172', red: '#b33d4c', green: '#547a63', gold: '#c58b30', violet: '#76578f', muted: '#5f6c76' };
let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1250" viewBox="0 0 1800 1250" role="img" aria-labelledby="title desc"><title id="title">TopoStrawberry dataset composition</title><desc id="desc">Final train, validation and test frame and instance counts, with maturity, occlusion, harvestability and keypoint visibility distributions.</desc>';
const rect = (x,y,w,h,fill,stroke='none') => { svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`; };
const text = (x,y,value,size=22,color=colors.navy,bold=false) => { svg += `<text x="${x}" y="${y}" font-family="Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="${bold ? 600 : 400}" fill="${color}">${escape(value)}</text>`; };
const panel = (x,y,w,h,letter,title) => { rect(x,y,w,h,'#ffffff','#d5dde3'); text(x+28,y+36,letter,16,colors.blue,true); text(x+28,y+86,title,27,colors.navy,true); };
rect(0,0,1800,1250,'#f3f6f8'); rect(0,0,1800,112,colors.navy);
text(52,65,'DATASET COMPOSITION',25,'#c9d9e2',true);
text(52,162,`${n(splits.reduce((sum,s)=>sum+s.images.length,0))} synchronized RGB-D frames · ${n(annotations.length)} strawberry instances · ${n(annotations.reduce((sum,a)=>sum+a.keypoints.length/3,0))} keypoints`,28,colors.navy,true);
text(52,202,'Split: 70% Train / 15% Validation / 15% Test.',21,colors.muted);
function horizontal(x, title, key, color, letter) {
    panel(x,232,840,500,letter,title);
    const values=splits.map(s=>s[key].length), max=Math.max(...values);
    splits.forEach((s,i)=>{
        const y=365+i*112, width=535*values[i]/max;
        text(x+28,y+28,s.label,22,colors.muted);
        rect(x+162,y,width,57,color);
        text(x+172+width,y+32,n(values[i]),21,colors.navy,true);
    });
}
horizontal(44,'Frames by split','images',colors.blue,'A');
horizontal(916,'Instances by split','annotations',colors.red,'B');
const categories = [
    ['Maturity categories', count(annotations.map(a=>a.maturity)), colors.green, '0 = unripe; 1 = ripe'],
    ['Occlusion categories', count(annotations.map(a=>a.occlusion)), colors.gold, '0 = unoccluded; 1 = occluded'],
    ['Harvestability categories', count(annotations.map(a=>a.harvestability)), colors.violet, '0 = not harvestable; 1 = harvestable'],
    ['Keypoint visibility', count(annotations.flatMap(a=>a.keypoints.filter((v,i)=>i%3===2))), colors.blue, '0 = outside; 1 = occluded; 2 = visible'],
];
categories.forEach(([title,counts,color,legend],index)=>{
    const x=44+index*433,w=413,y=766;
    panel(x,y,w,440,String.fromCharCode(67+index),title);
    const entries=Object.entries(counts).sort((a,b)=>Number(a[0])-Number(b[0]));
    const total=entries.reduce((sum,[,v])=>sum+v,0), max=Math.max(...entries.map(([,v])=>v));
    const gap=24,bw=(w-70-gap*(entries.length-1))/entries.length;
    entries.forEach(([label,value],i)=>{
        const bx=x+35+i*(bw+gap),height=210*value/max,top=1130-height;
        rect(bx,top,bw,height,color);
        text(bx,top-14,`${n(value)} · ${(100*value/total).toFixed(1)}%`,17,colors.navy,true);
        text(bx,1157,label,20,colors.navy,true);
    });
    text(x+22,1189,legend,17,colors.muted);
});
svg += '</svg>\n';
for(const folder of ['src/assets','dist/assets']) fs.writeFileSync(path.join(__dirname,'..',folder,'dataset-distributions.svg'),svg);
console.log('Rendered final dataset composition:', splits.map(s=>`${s.label}: ${s.images.length} frames, ${s.annotations.length} instances`).join('; '));
