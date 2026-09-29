'use client'
import { FormEvent,useEffect,useMemo,useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brand,useBranding } from '@/components/Branding'
import { createClient } from '@/lib/supabase/client'

type Tab='dashboard'|'todo'|'residents'|'bookings'|'courts'|'reports'|'news'|'settings'
const communities=['Mira 1','Mira 2','Mira 3','Mira 4','Mira 5','Mira Oasis 1','Mira Oasis 2','Mira Oasis 3']
function dateOnly(v:string){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dubai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v))}
function shortDate(v:string){return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',day:'numeric',month:'short',year:'numeric'}).format(new Date(v))}
function time(v:string){return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(v))}
function relationName(x:any,key:string){if(Array.isArray(x))return x[0]?.[key];return x?.[key]}

export default function Admin(){
 const router=useRouter()
 const {settings,reload:reloadBranding}=useBranding()
 const [tab,setTab]=useState<Tab>('dashboard')
 const [allowed,setAllowed]=useState<boolean|null>(null)
 const [me,setMe]=useState<any>(null)
 const [profiles,setProfiles]=useState<any[]>([])
 const [bookings,setBookings]=useState<any[]>([])
 const [courts,setCourts]=useState<any[]>([])
 const [reports,setReports]=useState<any[]>([])
 const [closures,setClosures]=useState<any[]>([])
 const [news,setNews]=useState<any[]>([])
 const [audit,setAudit]=useState<any[]>([])
 const [appSettings,setAppSettings]=useState<any>(null)
 const [msg,setMsg]=useState('')
 const [search,setSearch]=useState('')
 const [residentStatus,setResidentStatus]=useState('all')
 const [community,setCommunity]=useState('all')
 const [bookingCourt,setBookingCourt]=useState('all')
 const [bookingStatus,setBookingStatus]=useState('all')
 const [bookingDate,setBookingDate]=useState('')
 const [selected,setSelected]=useState<any>(null)
 const [busy,setBusy]=useState(false)

 async function load(){
  const s=createClient()
  const {data:{user}}=await s.auth.getUser()
  if(!user){router.push('/');return}
  const {data:m}=await s.from('profiles').select('*').eq('user_id',user.id).single()
  if(m?.role!=='admin'||m?.status!=='approved'){setAllowed(false);return}
  setMe(m);setAllowed(true)
  const [{data:p},{data:b},{data:c},{data:r},{data:cl},{data:n},{data:a},{data:st}]=await Promise.all([
   s.from('profiles').select('*,villas(community,villa_number)').order('created_at',{ascending:false}),
   s.from('bookings').select('*,courts(display_name),villas(community,villa_number)').order('starts_at',{ascending:false}).limit(1000),
   s.from('courts').select('*').order('sort_order'),
   s.from('no_show_reports').select('*,bookings(id,user_id,court_id,starts_at,ends_at,courts(display_name),villas(community,villa_number))').order('reported_at',{ascending:false}),
   s.from('court_closures').select('*,courts(display_name)').order('starts_at',{ascending:false}),
   s.from('news_updates').select('*').order('created_at',{ascending:false}),
   s.from('audit_log').select('*').order('created_at',{ascending:false}).limit(100),
   s.from('app_settings').select('*').eq('id',1).single()
  ])
  setProfiles(p||[]);setCourts(c||[]);setReports(r||[]);setClosures(cl||[]);setNews(n||[]);setAudit(a||[]);setAppSettings(st||null)
  setBookings((b||[]).map((x:any)=>({...x,owner:(p||[]).find((q:any)=>q.user_id===x.user_id)})))
 }
 useEffect(()=>{load()},[])

 const pendingResidents=profiles.filter(p=>p.status==='pending')
 const pendingReports=reports.filter(r=>r.status==='pending')
 const todoCount=pendingResidents.length+pendingReports.length
 const today=dateOnly(new Date().toISOString())
 const todayBookings=bookings.filter(b=>b.status==='active'&&b.booking_date===today)
 const futureBookings=bookings.filter(b=>b.status==='active'&&new Date(b.starts_at).getTime()>Date.now())
 const approvedResidents=profiles.filter(p=>p.status==='approved'&&p.role==='resident')
 const filteredResidents=profiles.filter(p=>{
  const q=search.toLowerCase(),v=p.villas
  const matches=!q||`${p.first_name||''} ${p.last_name||''} ${p.email||''} ${p.mobile||''} ${v?.community||''} ${v?.villa_number||''}`.toLowerCase().includes(q)
  return matches&&(residentStatus==='all'||p.status===residentStatus)&&(community==='all'||v?.community===community)
 })
 const filteredBookings=bookings.filter(b=>{
  const q=search.toLowerCase()
  const matches=!q||`${b.owner?.first_name||''} ${b.owner?.last_name||''} ${b.owner?.email||''} ${relationName(b.courts,'display_name')||''} ${b.villas?.community||''} ${b.villas?.villa_number||''}`.toLowerCase().includes(q)
  return matches&&(bookingCourt==='all'||String(b.court_id)===bookingCourt)&&(bookingStatus==='all'||b.status===bookingStatus)&&(!bookingDate||b.booking_date===bookingDate)
 })
 const last7=useMemo(()=>Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const key=dateOnly(d.toISOString());return {key,label:new Intl.DateTimeFormat('en-GB',{weekday:'short'}).format(d),count:bookings.filter(b=>b.booking_date===key).length}}),[bookings])
 const max7=Math.max(1,...last7.map(x=>x.count))

 async function residentStatusAction(userId:string,status:'approved'|'rejected'|'suspended'){const s=createClient();const {error}=await s.rpc('admin_set_resident_status',{p_user_id:userId,p_status:status});setMsg(error?error.message:`Resident ${status}.`);await load()}
 async function setRole(userId:string,role:'resident'|'admin'){const s=createClient();const {error}=await s.rpc('admin_set_user_role',{p_user_id:userId,p_role:role});setMsg(error?error.message:`Role changed to ${role}.`);await load()}
 async function cancelBooking(id:string){const s=createClient();const {error}=await s.rpc('admin_cancel_booking',{p_booking_id:id});setMsg(error?error.message:'Booking cancelled.');await load()}
 async function resetPassword(email:string){const s=createClient();const {error}=await s.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/reset-password`});setMsg(error?error.message:'Password reset email sent.')}
 async function saveResident(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!selected)return;const f=new FormData(e.currentTarget);const s=createClient();const {error}=await s.from('profiles').update({first_name:String(f.get('first_name')),last_name:String(f.get('last_name')),mobile:String(f.get('mobile'))}).eq('user_id',selected.user_id);setMsg(error?error.message:'Resident profile updated.');if(!error){setSelected(null);await load()}}
 async function reviewReport(id:string,status:'confirmed'|'dismissed'){const s=createClient();const {error}=await s.rpc('admin_review_no_show',{p_report_id:id,p_status:status,p_note:null});setMsg(error?error.message:`Report ${status}.`);await load()}
 async function toggleCourt(id:number,active:boolean){const s=createClient();const {error}=await s.from('courts').update({active}).eq('id',id);setMsg(error?error.message:`Court ${active?'opened':'disabled'}.`);await load()}
 async function addClosure(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);const s=createClient();const {data:{user}}=await s.auth.getUser();const start=String(f.get('starts_at')),end=String(f.get('ends_at'));const {error}=await s.from('court_closures').insert({court_id:Number(f.get('court_id')),starts_at:new Date(start).toISOString(),ends_at:new Date(end).toISOString(),reason:String(f.get('reason')),created_by:user?.id});setMsg(error?error.message:'Court closure added.');if(!error){e.currentTarget.reset();await load()}}
 async function removeClosure(id:string){const s=createClient();const {error}=await s.from('court_closures').delete().eq('id',id);setMsg(error?error.message:'Closure removed.');await load()}
 async function addNews(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);const s=createClient();const {data:{user}}=await s.auth.getUser();const {error}=await s.from('news_updates').insert({title:String(f.get('title')),body:String(f.get('body')),published:true,published_at:new Date().toISOString(),created_by:user?.id});setMsg(error?error.message:'News update published.');if(!error){e.currentTarget.reset();await load()}}
 async function toggleNews(id:string,published:boolean){const s=createClient();const {error}=await s.from('news_updates').update({published,published_at:published?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq('id',id);setMsg(error?error.message:(published?'Published.':'Unpublished.'));await load()}
 async function deleteNews(id:string){const s=createClient();const {error}=await s.from('news_updates').delete().eq('id',id);setMsg(error?error.message:'Update deleted.');await load()}
 async function saveSettings(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);const s=createClient();const {data:{user}}=await s.auth.getUser();const changes={app_name:String(f.get('app_name')),primary_color:String(f.get('primary_color')),accent_color:String(f.get('accent_color')),surface_color:String(f.get('surface_color')),admin_notification_email:String(f.get('admin_notification_email')),email_notifications_enabled:f.get('email_notifications_enabled')==='on',updated_at:new Date().toISOString(),updated_by:user?.id};const {error}=await s.from('app_settings').update(changes).eq('id',1);setMsg(error?error.message:'Settings saved.');if(!error){await reloadBranding();await load()}}
 async function uploadLogo(file:File){setBusy(true);const s=createClient();const ext=file.name.split('.').pop()||'png';const path=`logo-${Date.now()}.${ext}`;const {error}=await s.storage.from('branding').upload(path,file,{upsert:true});if(error){setMsg(error.message);setBusy(false);return}const {data}=s.storage.from('branding').getPublicUrl(path);const {data:{user}}=await s.auth.getUser();const {error:u}=await s.from('app_settings').update({logo_url:data.publicUrl,updated_at:new Date().toISOString(),updated_by:user?.id}).eq('id',1);setMsg(u?u.message:'Logo updated.');setBusy(false);if(!u){await reloadBranding();await load()}}
 async function inviteUser(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);const f=new FormData(e.currentTarget);const s=createClient();const {data,error}=await s.functions.invoke('admin-invite-user',{body:{email:String(f.get('email')),first_name:String(f.get('first_name')),last_name:String(f.get('last_name')),mobile:String(f.get('mobile')),community:String(f.get('community')),villa_number:Number(f.get('villa_number')),role:String(f.get('role')),redirect_to:location.origin}});setBusy(false);setMsg(error?error.message:data?.error||'Invitation sent.');if(!error&&!data?.error){e.currentTarget.reset();await load()}}

 if(allowed===null)return <main className="shell">Loading admin…</main>
 if(!allowed)return <main className="shell"><div className="error">Admin access required.</div></main>

 return <main className="shell">
  <div className="topbar"><div><Brand admin/><div className="tag">Operations & community management</div></div><div className="nav"><a href="/dashboard">Resident view</a></div></div>
  <div className="adminTabs">{(['dashboard','todo','residents','bookings','courts','reports','news','settings'] as Tab[]).map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t==='todo'?`To Do (${todoCount})`:t[0].toUpperCase()+t.slice(1)}</button>)}</div>
  {msg&&<div className={/saved|sent|updated|approved|rejected|cancelled|added|removed|published|disabled|opened|changed|dismissed|confirmed/i.test(msg)?'notice':'error'} style={{marginBottom:16}}>{msg}</div>}

  {tab==='dashboard'&&<>
   <div className="grid4"><Metric label="Approved residents" value={approvedResidents.length}/><Metric label="Pending approvals" value={pendingResidents.length}/><Metric label="Bookings today" value={todayBookings.length}/><Metric label="Future bookings" value={futureBookings.length}/></div>
   <div className="grid2" style={{marginTop:16}}>
    <section className="card"><h2>Bookings — last 7 days</h2><div className="barChart">{last7.map(x=><div className="barCol" key={x.key}><div className="barValue">{x.count}</div><div className="bar" style={{height:`${Math.max(8,(x.count/max7)*160)}px`}}></div><span>{x.label}</span></div>)}</div></section>
    <section className="card"><h2>Action required</h2><div className="todoSummary"><button onClick={()=>setTab('todo')}><strong>{pendingResidents.length}</strong><span>resident approvals</span></button><button onClick={()=>setTab('todo')}><strong>{pendingReports.length}</strong><span>no-show reports</span></button></div></section>
   </div>
   <section className="card" style={{marginTop:16}}><h2>Recent admin activity</h2>{audit.slice(0,12).map(a=><div className="auditRow" key={a.id}><span>{a.action.replaceAll('_',' ')}</span><span className="muted">{shortDate(a.created_at)} {time(a.created_at)}</span></div>)}</section>
  </>}

  {tab==='todo'&&<>
   <section className="card"><h2>Pending resident approvals</h2>{pendingResidents.length?pendingResidents.map(p=><ResidentRow key={p.user_id} p={p} open={()=>setSelected(p)} actions={<><button className="btn" onClick={()=>residentStatusAction(p.user_id,'approved')}>Approve</button><button className="btn danger" onClick={()=>residentStatusAction(p.user_id,'rejected')}>Reject</button></>}/>):<p className="muted">No resident approvals pending.</p>}</section>
   <section className="card" style={{marginTop:16}}><h2>Pending no-show reports</h2>{pendingReports.length?pendingReports.map(r=><ReportRow key={r.id} r={r} profiles={profiles} actions={<><button className="btn" onClick={()=>reviewReport(r.id,'confirmed')}>Confirm</button><button className="btn secondary" onClick={()=>reviewReport(r.id,'dismissed')}>Dismiss</button></>}/>):<p className="muted">No reports pending.</p>}</section>
  </>}

  {tab==='residents'&&<section className="card"><div className="sectionHead"><div><h2>Residents & admins</h2><p className="muted">{filteredResidents.length} records</p></div></div><div className="filterbar"><input placeholder="Search name, email, mobile or villa" value={search} onChange={e=>setSearch(e.target.value)}/><select value={residentStatus} onChange={e=>setResidentStatus(e.target.value)}><option value="all">All statuses</option><option>pending</option><option>approved</option><option>rejected</option><option>suspended</option></select><select value={community} onChange={e=>setCommunity(e.target.value)}><option value="all">All communities</option>{communities.map(x=><option key={x}>{x}</option>)}</select></div><div className="tableWrap"><table><thead><tr><th>Resident</th><th>Villa</th><th>Contact</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>{filteredResidents.map(p=><tr key={p.user_id}><td><button className="linkBtn" onClick={()=>setSelected(p)}>{p.first_name} {p.last_name}</button></td><td>{p.villas?`${p.villas.community} #${p.villas.villa_number}`:'—'}</td><td>{p.email}<br/>{p.mobile}</td><td>{p.role}</td><td><span className="pill">{p.status}</span></td><td><button className="btn secondary" onClick={()=>setSelected(p)}>Profile</button></td></tr>)}</tbody></table></div></section>}

  {tab==='bookings'&&<section className="card"><h2>Bookings</h2><div className="filterbar"><input placeholder="Search resident, villa or court" value={search} onChange={e=>setSearch(e.target.value)}/><select value={bookingCourt} onChange={e=>setBookingCourt(e.target.value)}><option value="all">All courts</option>{courts.map(c=><option key={c.id} value={c.id}>{c.display_name}</option>)}</select><select value={bookingStatus} onChange={e=>setBookingStatus(e.target.value)}><option value="all">All statuses</option><option value="active">active</option><option value="cancelled">cancelled</option></select><input type="date" value={bookingDate} onChange={e=>setBookingDate(e.target.value)}/></div><div className="tableWrap"><table><thead><tr><th>Court</th><th>Date / time</th><th>Resident</th><th>Villa</th><th>Status</th><th></th></tr></thead><tbody>{filteredBookings.map(b=><tr key={b.id}><td>{relationName(b.courts,'display_name')}</td><td>{shortDate(b.starts_at)}<br/>{time(b.starts_at)}–{time(b.ends_at)}</td><td>{b.owner?.first_name} {b.owner?.last_name}<br/>{b.owner?.email}</td><td>{b.villas?`${b.villas.community} #${b.villas.villa_number}`:'—'}</td><td>{b.status}</td><td>{b.status==='active'&&new Date(b.starts_at)>new Date()&&<button className="btn danger" onClick={()=>cancelBooking(b.id)}>Cancel</button>}</td></tr>)}</tbody></table></div></section>}

  {tab==='courts'&&<>
   <div className="courtAdminGrid">{courts.map(c=><div className="card" key={c.id}><div className="sectionHead"><div><h3>{c.display_name}</h3><span className="tag">{c.area}</span></div><span className={c.active?'statusGood':'statusOff'}>{c.active?'Open':'Disabled'}</span></div><button className={c.active?'btn danger':'btn'} onClick={()=>toggleCourt(c.id,!c.active)}>{c.active?'Disable court':'Enable court'}</button></div>)}</div>
   <div className="grid2" style={{marginTop:16}}><form className="card stack" onSubmit={addClosure}><h2>Add closure / maintenance</h2><div className="field"><label>Court</label><select name="court_id">{courts.map(c=><option key={c.id} value={c.id}>{c.display_name}</option>)}</select></div><div className="field"><label>Starts</label><input name="starts_at" type="datetime-local" required/></div><div className="field"><label>Ends</label><input name="ends_at" type="datetime-local" required/></div><div className="field"><label>Reason</label><input name="reason" required placeholder="Maintenance"/></div><button className="btn">Add closure</button></form><section className="card"><h2>Closures</h2>{closures.length?closures.map(cl=><div className="booking" key={cl.id}><div><strong>{relationName(cl.courts,'display_name')}</strong><div className="muted">{shortDate(cl.starts_at)} {time(cl.starts_at)} → {shortDate(cl.ends_at)} {time(cl.ends_at)}</div><div>{cl.reason}</div></div><button className="btn danger" onClick={()=>removeClosure(cl.id)}>Remove</button></div>):<p className="muted">No closures.</p>}</section></div>
  </>}

  {tab==='reports'&&<section className="card"><h2>No-show reports</h2>{reports.length?reports.map(r=><ReportRow key={r.id} r={r} profiles={profiles} actions={r.status==='pending'?<><button className="btn" onClick={()=>reviewReport(r.id,'confirmed')}>Confirm</button><button className="btn secondary" onClick={()=>reviewReport(r.id,'dismissed')}>Dismiss</button></>:<span className="pill">{r.status}</span>}/>):<p className="muted">No reports.</p>}</section>}

  {tab==='news'&&<div className="grid2"><form className="card stack" onSubmit={addNews}><h2>Publish news / update</h2><div className="field"><label>Title</label><input name="title" maxLength={140} required/></div><div className="field"><label>Message</label><textarea name="body" rows={7} maxLength={3000} required/></div><button className="btn">Publish</button></form><section className="card"><h2>Published updates</h2>{news.length?news.map(n=><div className="newsAdmin" key={n.id}><div><strong>{n.title}</strong><p>{n.body}</p><span className="tag">{n.published?'Published':'Draft'}</span></div><div className="row"><button className="btn secondary" onClick={()=>toggleNews(n.id,!n.published)}>{n.published?'Unpublish':'Publish'}</button><button className="btn danger" onClick={()=>deleteNews(n.id)}>Delete</button></div></div>):<p className="muted">No updates.</p>}</section></div>}

  {tab==='settings'&&<div className="stack">
   <div className="grid2">
    <form className="card stack" onSubmit={saveSettings}><h2>Branding & notifications</h2><div className="field"><label>App name</label><input name="app_name" defaultValue={appSettings?.app_name||settings.app_name}/></div><div className="grid3"><div className="field"><label>Primary</label><input name="primary_color" type="color" defaultValue={appSettings?.primary_color||'#145c46'}/></div><div className="field"><label>Accent</label><input name="accent_color" type="color" defaultValue={appSettings?.accent_color||'#d8b46a'}/></div><div className="field"><label>Background</label><input name="surface_color" type="color" defaultValue={appSettings?.surface_color||'#f6f4ee'}/></div></div><div className="field"><label>Admin notification email</label><input name="admin_notification_email" type="email" defaultValue={appSettings?.admin_notification_email||''}/></div><label className="row"><input type="checkbox" name="email_notifications_enabled" defaultChecked={appSettings?.email_notifications_enabled!==false}/> Email notifications enabled</label><button className="btn">Save settings</button></form>
    <div className="card stack"><h2>Logo</h2>{settings.logo_url&&<img src={settings.logo_url} alt="Current logo" className="logoPreview"/>}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)uploadLogo(f)}}/><p className="muted">PNG, JPG, WebP or SVG. Maximum 5MB.</p></div>
   </div>
   <div className="grid2">
    <form className="card stack" onSubmit={inviteUser}><h2>Add / invite user</h2><div className="grid2"><div className="field"><label>First name</label><input name="first_name" required/></div><div className="field"><label>Last name</label><input name="last_name" required/></div></div><div className="field"><label>Email</label><input name="email" type="email" required/></div><div className="field"><label>Mobile</label><input name="mobile" required/></div><div className="grid2"><div className="field"><label>Community</label><select name="community">{communities.map(x=><option key={x}>{x}</option>)}</select></div><div className="field"><label>Villa</label><input name="villa_number" type="number" min={1} required/></div></div><div className="field"><label>Role</label><select name="role"><option value="resident">Resident</option><option value="admin">Admin</option></select></div><button className="btn" disabled={busy}>{busy?'Working…':'Send invitation'}</button></form>
    <section className="card"><h2>Administrators</h2>{profiles.filter(p=>p.role==='admin').map(p=><div className="booking" key={p.user_id}><div><strong>{p.first_name} {p.last_name}</strong><div className="muted">{p.email}</div></div>{p.user_id!==me?.user_id&&<button className="btn danger" onClick={()=>setRole(p.user_id,'resident')}>Remove admin</button>}</div>)}</section>
   </div>
  </div>}

  {selected&&<div className="modalBackdrop"><div className="card modalCard wideModal"><div className="sectionHead"><h2>Resident profile</h2><button className="textBtn" onClick={()=>setSelected(null)}>Close</button></div><form className="stack" onSubmit={saveResident}><div className="grid2"><div className="field"><label>First name</label><input name="first_name" defaultValue={selected.first_name||''}/></div><div className="field"><label>Last name</label><input name="last_name" defaultValue={selected.last_name||''}/></div></div><div className="field"><label>Email</label><input value={selected.email} disabled/></div><div className="field"><label>Mobile</label><input name="mobile" defaultValue={selected.mobile||''}/></div><div className="field"><label>Villa</label><input value={selected.villas?`${selected.villas.community} · Villa ${selected.villas.villa_number}`:'—'} disabled/></div><div className="row"><button className="btn">Save profile</button><button type="button" className="btn secondary" onClick={()=>resetPassword(selected.email)}>Send password reset</button>{selected.status==='approved'&&selected.role!=='admin'&&<button type="button" className="btn danger" onClick={()=>residentStatusAction(selected.user_id,'suspended')}>Suspend</button>}{selected.status==='suspended'&&<button type="button" className="btn" onClick={()=>residentStatusAction(selected.user_id,'approved')}>Reactivate</button>}{selected.role==='resident'?<button type="button" className="btn secondary" onClick={()=>setRole(selected.user_id,'admin')}>Make admin</button>:selected.user_id!==me?.user_id&&<button type="button" className="btn danger" onClick={()=>setRole(selected.user_id,'resident')}>Remove admin</button>}</div></form><h3 style={{marginTop:24}}>Booking history</h3>{bookings.filter(b=>b.user_id===selected.user_id).slice(0,12).map(b=><div className="booking" key={b.id}><div><strong>{relationName(b.courts,'display_name')}</strong><div className="muted">{shortDate(b.starts_at)} {time(b.starts_at)} · {b.status}</div></div></div>)}</div></div>}
 </main>
}

function Metric({label,value}:{label:string;value:number|string}){return <div className="card"><div className="muted">{label}</div><div className="stat">{value}</div></div>}
function ResidentRow({p,open,actions}:{p:any;open:()=>void;actions:any}){return <div className="booking"><button className="linkBtn" onClick={open}><strong>{p.first_name} {p.last_name}</strong><div className="muted">{p.villas?`${p.villas.community} #${p.villas.villa_number}`:'—'} · {p.email}</div></button><div className="row">{actions}</div></div>}
function ReportRow({r,profiles,actions}:{r:any;profiles:any[];actions:any}){const b=Array.isArray(r.bookings)?r.bookings[0]:r.bookings;const owner=profiles.find(p=>p.user_id===b?.user_id);return <div className="booking"><div><strong>{relationName(b?.courts,'display_name')||'Court'}</strong><div className="muted">{b?.starts_at?`${shortDate(b.starts_at)} ${time(b.starts_at)}`:''} · {owner?`${owner.first_name} ${owner.last_name}`:''}</div><span className="tag">{r.status}</span></div><div className="row">{actions}</div></div>}
