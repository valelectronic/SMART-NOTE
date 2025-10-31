import LoginButton from '@/components/auth/login.button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Package } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-6">
      <Card className="w-full max-w-sm sm:max-w-md shadow-lg border-border">
        {' '}
        {/* 320 → 384 px wide */}
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto p-3 rounded-full bg-primary text-primary-foreground w-fit">
            <Package className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-display font-bold text-foreground">
            SMARTNOTE
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">
           Sign in to your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {
            <LoginButton/>
          }
         
        </CardContent>

        <CardFooter className="flex justify-center">
                <Link
            href="/"
            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
            ← Back to Home
            </Link>
        </CardFooter>
      </Card>
    </div>
  )
}