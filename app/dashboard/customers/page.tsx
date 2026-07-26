'use client'
import{useState,useEffect}from'react'
import{supabase}from'@/lib/supabase'
import{Search,Plus,Phone,Edit2,Trash2,Download,X}from'lucide-react'
import{useToast}from'@/components/toast'

function ExportCSV({data,filename}:{data:any[],filename:string}){
  const handleExport=()=>{
    if(data.length===0)return
    const headers=Object.keys(data[0]).join(';')
    const rows=data.map(r=>Object.values(r).map(v=>String(v??'').replace(/;/g,',')).join(';'))
    const csv=[headers,...rows].join('
')
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'})
    const link=document.createElement('a')
    link.href=URL.createObjectURL(blob)
    link.download=filename
    link.click()
  }
  return<button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm"><Download size={16}/>Excel</button>
}

export default function CustomersPage(){
  const[customers,setCustomers]=useState<any[]>([])
  const[search,setSearch]=useState('')
  const[showModal,setShowModal]=useState(false)
  const[editing,setEditing]=useState<any>(null)
  const[form,setForm]=useState({full_name:'',phone:'',email:'',address:'',tc_no:'',notes:''})
  const{showToast,ToastComponent}=useToast()

  useEffect(()=>{fetchCustomers()},[])

  const fetchCustomers=async()=>{
    const{data:{user}}=await supabase.auth.getUser()
    const{data}=await supabase.from('customers').select('*').eq('user_id',user?.id).order('created_at',{ascending:false})
    setCustomers(data||[])
  }

  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault()
    const{data:{user}}=await supabase.auth.getUser()
    if(!user){showToast('Oturum bulunamadı','error');return}
    const payload={...form,user_id:user.id}
    if(editing){
      const{error}=await supabase.from('customers').update(payload).eq('id',editing.id)
      if(error)showToast('Hata: '+error.message,'error')
      else{showToast('Müşteri güncellendi');setShowModal(false);setEditing(null);fetchCustomers()}
    }else{
      const{error}=await supabase.from('customers').insert([payload])
      if(error)showToast('Hata: '+error.message,'error')
      else{showToast('Müşteri eklendi');setShowModal(false);setForm({full_name:'',phone:'',email:'',address:'',tc_no:'',notes:''});fetchCustomers()}
    }
  }

  const handleDelete=async(id:string)=>{
    if(!confirm('Silmek istediğinize emin misiniz?'))return
    const{error}=await supabase.from('customers').delete().eq('id',id)
    if(error)showToast('Hata: '+error.message,'error')
    else{showToast('Müşteri silindi');fetchCustomers()}
  }

  const filtered=customers.filter(c=>c.full_name?.toLowerCase().includes(search.toLowerCase())||c.phone?.includes(search)||c.email?.toLowerCase().includes(search.toLowerCase()))

  return(
    <div className="p-6 space-y-6">
      {ToastComponent}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Müşteriler</h1>
        <div className="flex gap-2">
          <ExportCSV data={customers} filename="musteriler.csv"/>
          <button onClick={()=>{setEditing(null);setForm({full_name:'',phone:'',email:'',address:'',tc_no:'',notes:''});setShowModal(true)}} className="btn-primary flex items-center gap-2"><Plus size={18}/>Yeni Müşteri</button>
        </div>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/><input className="input pl-10" placeholder="Ara..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="table-header">Ad Soyad</th><th className="table-header">Telefon</th><th className="table-header">E-posta</th><th className="table-header">Adres</th><th className="table-header">İşlem</th></tr></thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.map(c=>(
              <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="table-cell font-medium">{c.full_name}</td>
                <td className="table-cell"><a href={`tel:${c.phone}`} className="flex items-center gap-1 text-green-600 hover:underline"><Phone size={14}/>{c.phone}</a></td>
                <td className="table-cell">{c.email||'-'}</td>
                <td className="table-cell">{c.address||'-'}</td>
                <td className="table-cell"><div className="flex gap-2"><button onClick={()=>{setEditing(c);setForm(c);setShowModal(true)}} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16}/></button><button onClick={()=>handleDelete(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button></div></td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan={5} className="text-center py-8 text-gray-500">Müşteri bulunamadı</td></tr>}
          </tbody>
        </table>
      </div>
      {showModal&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold">{editing?'Müşteri Düzenle':'Yeni Müşteri'}</h2><button onClick={()=>setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20}/></button></div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input className="input" placeholder="Ad Soyad *" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} required/>
              <input className="input" placeholder="Telefon" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
              <input className="input" placeholder="E-posta" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
              <input className="input" placeholder="TC Kimlik No" value={form.tc_no} onChange={e=>setForm({...form,tc_no:e.target.value})}/>
              <input className="input" placeholder="Adres" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>
              <textarea className="input" placeholder="Notlar" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={3}/>
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={()=>setShowModal(false)} className="btn-secondary">İptal</button><button type="submit" className="btn-primary">{editing?'Güncelle':'Kaydet'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
