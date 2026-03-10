"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

import {
Chart as ChartJS,
CategoryScale,
LinearScale,
BarElement,
Title,
Tooltip,
Legend
} from "chart.js"

import { Bar } from "react-chartjs-2"

ChartJS.register(
CategoryScale,
LinearScale,
BarElement,
Title,
Tooltip,
Legend
)

const chartOptions = {
responsive:true,
maintainAspectRatio:false,
plugins:{
legend:{display:true}
}
}

export default function DashboardPage(){

const [meta,setMeta] = useState({
today:0,
month:0,
total:0,
transactions:0,
active:0
})

const [dailyChart,setDailyChart] = useState<any>(null)
const [monthlyChart,setMonthlyChart] = useState<any>(null)

const [status,setStatus] = useState({
active:0,
expiring:0,
expired:0
})

/* ================= META ================= */

async function loadMeta(){

const {data} = await supabase
.from("transactions")
.select("price,created_at")

let todayRevenue = 0
let monthRevenue = 0
let totalRevenue = 0

const today = new Date()
const month = today.getMonth()

data?.forEach((t:any)=>{

const date = new Date(t.created_at)

totalRevenue += t.price

if(date.toDateString()===today.toDateString()){
todayRevenue += t.price
}

if(date.getMonth()===month){
monthRevenue += t.price
}

})

setMeta({
today:todayRevenue,
month:monthRevenue,
total:totalRevenue,
transactions:data?.length || 0,
active:0
})

}

/* ================= DAILY CHART ================= */

async function loadDailyChart(){

const {data} = await supabase
.from("transactions")
.select(`products(name)`)

const counts:any = {}

data?.forEach((t:any)=>{

const name = t.products?.name || "Unknown"

counts[name] = (counts[name] || 0) + 1

})

const labels = Object.keys(counts)
const values = Object.values(counts)

setDailyChart({
labels,
datasets:[
{
label:"Daily Sales",
data:values,
backgroundColor:"#3b82f6"
}
]
})

}

/* ================= MONTHLY CHART ================= */

async function loadMonthlyChart(){

const {data} = await supabase
.from("transactions")
.select("price,created_at")

const months:any = {}

data?.forEach((t:any)=>{

const d = new Date(t.created_at)

const m = d.toLocaleString("default",{month:"short"})

months[m] = (months[m] || 0) + t.price

})

const labels = Object.keys(months)
const values = Object.values(months)

setMonthlyChart({
labels,
datasets:[
{
label:"Monthly Revenue",
data:values,
backgroundColor:"#22c55e"
}
]
})

}

/* ================= ACCOUNT STATUS ================= */

async function loadStatus(){

const {data} = await supabase
.from("transactions")
.select(`duration_days,
product_accounts(sold_at)`)

let active = 0
let expiring = 0
let expired = 0

data?.forEach((t:any)=>{

const sold = new Date(t.product_accounts?.sold_at)
const now = new Date()

const days = Math.floor(
(now.getTime()-sold.getTime())/(1000*60*60*24)
)

const duration = t.duration_days || 30

if(days <= duration-4) active++
else if(days <= duration) expiring++
else expired++

})

setStatus({
active,
expiring,
expired
})

}

/* ================= INIT ================= */

useEffect(()=>{

loadMeta()
loadDailyChart()
loadMonthlyChart()
loadStatus()

},[])

/* ================= UI ================= */

return(

<div className="space-y-8">

{/* HEADER */}

<div className="flex items-center justify-between">

<h1 className="text-2xl font-semibold tracking-tight">
Overview
</h1>

<span className="text-sm text-gray-400">
Dashboard Analytics
</span>

</div>

{/* META CARDS */}

<div className="grid grid-cols-5 gap-5">

<div className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition">
<div className="text-xs text-gray-500 mb-1">Revenue Today</div>
<div className="text-2xl font-semibold text-blue-600">
Rp {meta.today}
</div>
</div>

<div className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition">
<div className="text-xs text-gray-500 mb-1">Revenue Month</div>
<div className="text-2xl font-semibold text-green-600">
Rp {meta.month}
</div>
</div>

<div className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition">
<div className="text-xs text-gray-500 mb-1">Revenue Total</div>
<div className="text-2xl font-semibold text-purple-600">
Rp {meta.total}
</div>
</div>

<div className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition">
<div className="text-xs text-gray-500 mb-1">Transactions</div>
<div className="text-2xl font-semibold">
{meta.transactions}
</div>
</div>

<div className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition">
<div className="text-xs text-gray-500 mb-1">Active Accounts</div>
<div className="text-2xl font-semibold text-emerald-600">
{status.active}
</div>
</div>

</div>

{/* CHARTS */}

<div className="grid grid-cols-2 gap-6">

<div className="bg-white rounded-xl border shadow-sm p-6 h-[260px]">

<div className="flex justify-between mb-4">

<h2 className="font-medium text-gray-700">
Daily Sales by Product
</h2>

<span className="text-xs text-gray-400">
Today
</span>

</div>

{dailyChart && <Bar data={dailyChart} options={chartOptions}/>}

</div>

<div className="bg-white rounded-xl border shadow-sm p-6 h-[260px]">

<div className="flex justify-between mb-4">

<h2 className="font-medium text-gray-700">
Monthly Revenue
</h2>

<span className="text-xs text-gray-400">
Year
</span>

</div>

{monthlyChart && <Bar data={monthlyChart} options={chartOptions}/>}

</div>

</div>

{/* ACCOUNT STATUS */}

<div className="grid grid-cols-3 gap-6">

<div className="bg-white rounded-xl border shadow-sm p-5">
<div className="text-sm text-gray-500 mb-1">
Active Accounts
</div>
<div className="text-2xl font-semibold text-green-600">
{status.active}
</div>
</div>

<div className="bg-white rounded-xl border shadow-sm p-5">
<div className="text-sm text-gray-500 mb-1">
Expiring Accounts
</div>
<div className="text-2xl font-semibold text-yellow-500">
{status.expiring}
</div>
</div>

<div className="bg-white rounded-xl border shadow-sm p-5">
<div className="text-sm text-gray-500 mb-1">
Expired Accounts
</div>
<div className="text-2xl font-semibold text-red-500">
{status.expired}
</div>
</div>

</div>

</div>

)

}
