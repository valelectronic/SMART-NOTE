

import {v2 as cloudinary} from "cloudinary"
import { NextResponse } from "next/server"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


export async function POST(request:Request){
    try {

        const {timestamp,folder}  = await request.json()

        if (!timestamp || !folder) {
            return NextResponse.json({ error: "Missing required parameters (timestamp or folder)." }, { status: 400 });
        }
        const signature = cloudinary.utils.api_sign_request({
            timestamp,
            folder: folder
        }, process.env.CLOUDINARY_API_SECRET as string)

        return NextResponse.json({
            signature,
            timestamp,
            apiKey: process.env.CLOUDINARY_API_KEY
        })
        
    } catch (error) {
        console.error('error while generating cloudinary signature ',error)
        return NextResponse.json({
            error: "failed to generate signature"
        }, {status: 500})
        
    }
}