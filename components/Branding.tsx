'use client'
import { createContext,useContext,useEffect,useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type BrandingSettings={
  app_name:string
  primary_color:string
  accent_color:string
  surface_color:string
  logo_url:string|null
  admin_notification_email:string|null
  email_notifications_enabled:boolean
}

const defaults:BrandingSettings={
  app_name:'Mira Play',
  primary_color:'#145c46',
  accent_color:'#d8b46a',
  surface_color:'#f6f4ee',
  logo_url:null,
  admin_notification_email:null,
  email_notifications_enabled:true
}

const BrandingContext=createContext<{settings:BrandingSettings;reload:()=>Promise<void>}>({settings:defaults,reload:async()=>{}})

export function BrandingProvider({children}:{children:React.ReactNode}){
  const [settings,setSettings]=useState<BrandingSettings>(defaults)
  async function reload(){
    const s=createClient()
    const {data}=await s.from('app_settings').select('app_name,primary_color,accent_color,surface_color,logo_url,admin_notification_email,email_notifications_enabled').eq('id',1).maybeSingle()
    if(data)setSettings({...defaults,...data} as BrandingSettings)
  }
  useEffect(()=>{reload()},[])
  useEffect(()=>{
    const root=document.documentElement
    root.style.setProperty('--green',settings.primary_color)
    root.style.setProperty('--green2',settings.primary_color)
    root.style.setProperty('--accent',settings.accent_color)
    root.style.setProperty('--cream',settings.surface_color)
  },[settings])
  return <BrandingContext.Provider value={{settings,reload}}>{children}</BrandingContext.Provider>
}

export function useBranding(){return useContext(BrandingContext)}

export function Brand({href='/',admin=false}:{href?:string;admin?:boolean}){
  const {settings}=useBranding()
  return <a className="brand brandLockup" href={href}>
    {settings.logo_url?<img src={settings.logo_url} alt="" className="brandLogo"/>:<span className="brandDot">M</span>}
    <span>{settings.app_name}{admin?' Admin':''}</span>
  </a>
}
