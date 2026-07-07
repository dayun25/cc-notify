import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';

const DEFAULT_PORT = 3789;
const HOOK_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '~', '.claude', 'hooks');
const STYLE_PATH = path.join(process.env.HOME || process.env.USERPROFILE || '~', '.config', 'cc-notify', 'style.json');

function readStyle(): Record<string, unknown> {
  try {
    if (fs.existsSync(STYLE_PATH)) {
      return JSON.parse(fs.readFileSync(STYLE_PATH, 'utf-8'));
    }
  } catch {}
  return {};
}

function writeStyle(style: Record<string, unknown>): void {
  const dir = path.dirname(STYLE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const existing = readStyle();
  const merged = { ...existing, ...style };
  fs.writeFileSync(STYLE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
}

/** Fire a test floating window using the EXACT same script the Hook uses. */
function showFloatingWindow(title: string, message: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const psPath = path.join(HOOK_DIR, 'notify.ps1');
    if (!fs.existsSync(psPath)) {
      resolve({ success: false, error: `notify.ps1 not found: ${psPath}` });
      return;
    }
    execFile(
      'powershell',
      ['-ExecutionPolicy', 'Bypass', '-Command', `Add-Type -AssemblyName System.Windows.Forms,System.Drawing; & '${psPath}' -TestTitle '${title.replace(/'/g, "''")}' -TestMessage '${message.replace(/'/g, "''")}'`],
      { timeout: 15000 },
      (err) => {
        if (err) resolve({ success: false, error: err.message });
        else resolve({ success: true });
      },
    );
  });
}

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>cc-notify 通知样式管理</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#1a1a2e;color:#e0e0e0;min-height:100vh;padding:40px 20px}
  .container{max-width:680px;margin:0 auto}
  h1{font-size:22px;font-weight:600;color:#fff;margin-bottom:4px}
  .subtitle{color:#888;margin-bottom:28px;font-size:13px}
  .card{background:#16213e;border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid #0f3460}
  .card-title{font-size:15px;font-weight:600;margin-bottom:14px;color:#e94560}
  .style-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .style-item{display:flex;flex-direction:column;gap:3px}
  .style-item label{font-size:11px;color:#aaa}
  .style-item input,.style-item select{padding:7px 10px;border-radius:6px;border:1px solid #0f3460;background:#1a1a2e;color:#fff;font-size:13px;outline:none}
  .style-item input:focus,.style-item select:focus{border-color:#e94560}
  .style-item input[type=color]{height:34px;padding:2px;cursor:pointer}
  .color-row{display:flex;gap:8px;align-items:center}
  .color-row span{font-size:12px;color:#aaa;font-family:monospace}
  .preview{background:#323232;border-radius:8px;padding:10px 14px;margin-top:12px;transition:0.3s}
  .preview .p-title{font-size:13px;font-weight:600;color:#fff;margin-bottom:2px}
  .preview .p-body{font-size:11px;color:#fff}
  .btn-row{display:flex;gap:10px;margin-top:14px}
  .btn{padding:9px 22px;border-radius:8px;border:none;font-size:13px;cursor:pointer;font-weight:500;transition:0.2s}
  .btn-save{background:#e94560;color:#fff}.btn-save:hover{background:#d63851}
  .btn-test{background:transparent;border:1px solid #e94560;color:#e94560}.btn-test:hover{background:#e94560;color:#fff}
  .toast{position:fixed;bottom:20px;right:20px;background:#1b5e20;color:#fff;padding:12px 20px;border-radius:8px;font-size:13px;opacity:0;transition:0.3s;pointer-events:none;z-index:999}
  .toast.show{opacity:1}
  .toast.err{background:#5c1a1a}
  .loading{text-align:center;padding:30px;color:#666}
</style>
</head>
<body>
<div class="container">
  <h1>🔔 cc-notify</h1>
  <p class="subtitle">浮动窗口通知样式管理 — 调整后保存，Claude Code 回复完成时自动生效</p>

  <div class="card">
    <div class="card-title">通知样式</div>
    <div class="style-grid" id="style-editor"><div class="loading">加载中...</div></div>
    <div id="preview" class="preview">
      <div class="p-title">Claude Code [IntelliJ IDEA|workspace]</div>
      <div class="p-body" id="preview-msg">通知样式预览文字</div>
    </div>
    <div class="btn-row">
      <button class="btn btn-save" onclick="saveAndTest()">保存并测试</button>
    </div>
  </div>

  <div class="card">
    <div class="card-title">测试消息</div>
    <div style="display:flex;gap:10px">
      <input id="test-msg" style="flex:1;padding:10px 14px;border-radius:8px;border:1px solid #0f3460;background:#1a1a2e;color:#fff;font-size:14px;outline:none" placeholder="输入测试消息..." value="Hello from cc-notify">
      <button class="btn btn-save" onclick="saveAndTest()" style="flex-shrink:0">保存并测试</button>
    </div>
  </div>
</div>
<div id="toast" class="toast"></div>

<script>
const FIELDS = [
  {key:'fontSize',label:'字体大小',type:'range',min:6,max:20,unit:'pt'},
  {key:'fontFamily',label:'字体',type:'select',opts:['Microsoft YaHei','SimSun','Segoe UI','Consolas','Arial']},
  {key:'bgColor',label:'背景色',type:'color'},
  {key:'textColor',label:'文字色',type:'color'},
  {key:'opacity',label:'透明度',type:'range',min:0.3,max:1,step:0.05},
  {key:'duration',label:'显示时长',type:'range',min:1,max:10,unit:'秒'},
  {key:'position',label:'位置',type:'select',opts:['bottom-right','bottom-left','top-right','top-left']},
  {key:'width',label:'窗口宽度',type:'range',min:220,max:600,unit:'px'},
  {key:'height',label:'窗口高度',type:'range',min:40,max:300,unit:'px'},
];
const DEFS = {fontSize:9,fontFamily:'Microsoft YaHei',bgColor:'#323232',textColor:'#ffffff',opacity:0.95,duration:4,position:'bottom-right',width:340,height:62};
let style = {...DEFS};

function toast(msg,err){const t=document.getElementById('toast');t.textContent=msg;t.className='toast '+(err?'err':'')+' show';setTimeout(()=>t.className='toast',2500)}

async function loadStyle(){
  const r=await fetch('/api/style').then(x=>x.json());
  style={...DEFS,...r};
  renderEditor();
}

function renderEditor(){
  document.getElementById('style-editor').innerHTML=FIELDS.map(f=>{
    const v=style[f.key]??DEFS[f.key];
    if(f.type==='color') return '<div class="style-item"><label>'+f.label+'</label><div class="color-row"><input type="color" id="s-'+f.key+'" value="'+v+'" onchange="changed()"><span>'+v+'</span></div></div>';
    if(f.type==='select') return '<div class="style-item"><label>'+f.label+'</label><select id="s-'+f.key+'" onchange="changed()">'+f.opts.map(o=>'<option value="'+o+'"'+(v===o?' selected':'')+'>'+o+'</option>').join('')+'</select></div>';
    const step=f.step?' step="'+f.step+'"':'';
    return '<div class="style-item"><label>'+f.label+' <span id="sv-'+f.key+'" style="color:#e94560">'+v+(f.unit||'')+'</span></label><input type="range" id="s-'+f.key+'" min="'+f.min+'" max="'+f.max+'"'+step+' value="'+v+'" oninput="changed()"></div>';
  }).join('');
  updatePreview();
}

function getVal(key){
  const el=document.getElementById('s-'+key);if(!el)return DEFS[key];
  const f=FIELDS.find(x=>x.key===key);
  if(f?.type==='range'&&f?.step&&f.step<1)return parseFloat(el.value);
  if(f?.type==='range')return parseInt(el.value);
  return el.value;
}

function changed(){
  FIELDS.forEach(f=>{
    style[f.key]=getVal(f.key);
    if(f.type==='range'){const sv=document.getElementById('sv-'+f.key);if(sv)sv.textContent=style[f.key]+(f.unit||'')}
  });
  updatePreview();
}

function updatePreview(){
  const p=document.getElementById('preview');
  p.style.background=style.bgColor;p.style.opacity=style.opacity;p.style.width=style.width+'px';
  if(style.height)p.style.height=style.height+'px';
  p.querySelector('.p-title').style.fontSize=style.fontSize+'pt';
  p.querySelector('.p-title').style.fontFamily=style.fontFamily;
  p.querySelector('.p-title').style.color=style.textColor;
  p.querySelector('.p-body').style.fontSize=Math.max(8,style.fontSize-2)+'pt';
  p.querySelector('.p-body').style.fontFamily=style.fontFamily;
  p.querySelector('.p-body').style.color=style.textColor;
}

async function saveAndTest(){
  const msg=document.getElementById('test-msg').value.trim()||'\\u6d4b\\u8bd5\\u901a\\u77e5';
  const data={};FIELDS.forEach(f=>{data[f.key]=getVal(f.key)});
  data.message=msg;
  const r=await fetch('/api/style',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(x=>x.json());
  if(r.ok) toast('\\u2705 \\u5df2\\u4fdd\\u5b58\\u5e76\\u6d4b\\u8bd5\\u901a\\u77e5');
  else toast('\\u274c \\u5931\\u8d25: '+(r.error||''),true);
}

loadStyle();
</script>
</body>
</html>`;

export async function startWebUi(port?: number): Promise<void> {
  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    try {
      const url = new URL(req.url || '/', `http://localhost:${port || DEFAULT_PORT}`);
      const pathname = url.pathname;

      // GET /api/style — read current style
      if (pathname === '/api/style' && req.method === 'GET') {
        const current = readStyle();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(current));
        return;
      }

      // POST /api/style — save style + optionally fire test
      if (pathname === '/api/style' && req.method === 'POST') {
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}');
            const { message, ...styleData } = data;
            writeStyle(styleData);

            if (message) {
              const r = await showFloatingWindow('Claude Code', message);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: r.success, error: r.error }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true }));
            }
          } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: String(e) }));
          }
        });
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(HTML);
    } catch {
      res.writeHead(500);
      res.end('Error');
    }
  });

  const p = port || DEFAULT_PORT;
  server.listen(p, () => {
    console.log(`\n  cc-notify Web UI  http://localhost:${p}\n`);
  });
}
