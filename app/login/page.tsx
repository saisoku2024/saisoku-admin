"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function LoginPage(){

const router = useRouter()

const [email,setEmail] = useState("")
const [password,setPassword] = useState("")
const [showPassword,setShowPassword] = useState(false)

const handleLogin = async () => {

const { error } = await supabase.auth.signInWithPassword({
email,
password
})

if(error){
alert(error.message)
return
}

router.push("/dashboard")

}

const loginWithGoogle = async () => {

await supabase.auth.signInWithOAuth({
provider:"google"
})

}

const loginWithPhone = async () => {

const phone = prompt("Enter phone number")

if(!phone) return

await supabase.auth.signInWithOtp({
phone
})

alert("OTP sent to your phone")

}

const resetPassword = async () => {

if(!email){
alert("Enter your email first")
return
}

const { error } = await supabase.auth.resetPasswordForEmail(email)

if(error){
alert(error.message)
return
}

alert("Password reset link sent to your email")

}

return(

<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">

<div className="bg-white/95 backdrop-blur p-8 rounded-2xl shadow-xl w-96 space-y-5">

{/* Logo / Title */}

<div className="text-center space-y-1">

<h1 className="text-2xl font-bold text-gray-800">
SAISOKU
</h1>

<p className="text-sm text-gray-500">
Sales Management System — SAISOKU.ID
</p>

</div>

{/* Email */}

<input
type="email"
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-black"
/>

{/* Password */}

<div className="relative">

<input
type={showPassword ? "text" : "password"}
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
className="w-full border rounded-lg p-2 pr-12 focus:outline-none focus:ring-2 focus:ring-black"
/>

<button
type="button"
onClick={()=>setShowPassword(!showPassword)}
className="absolute right-3 top-2 text-sm text-gray-500"
>
{showPassword ? "Hide" : "Show"}
</button>

</div>

{/* Forgot password */}

<div className="text-right text-sm">

<button
onClick={resetPassword}
className="text-blue-600 hover:underline"
>
Forgot password?
</button>

</div>

{/* Login */}

<button
onClick={handleLogin}
className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
>
Login
</button>

{/* Divider */}

<div className="text-center text-gray-400 text-sm">
OR
</div>

{/* Google Login */}

<button
onClick={loginWithGoogle}
className="w-full border py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
>

<img
src="https://www.svgrepo.com/show/475656/google-color.svg"
className="w-5 h-5"
/>

Continue with Google

</button>

{/* Phone Login */}

<button
onClick={loginWithPhone}
className="w-full border py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
>

<img
src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
className="w-5 h-5"
/>

Login with Phone

</button>

{/* Footer */}

<div className="text-center text-xs text-gray-400 pt-3">
© SAISOKU.ID
</div>

</div>

</div>

)

}