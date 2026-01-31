import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, ChefHat, Store, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

// Cook session storage key
const COOK_SESSION_KEY = 'penny_carbs_cook_session';

export interface CookSession {
  cookId: string;
  kitchenName: string;
  mobileNumber: string;
  panchayatId: string | null;
}

// Helper to get/set cook session
export const getCookSession = (): CookSession | null => {
  const stored = localStorage.getItem(COOK_SESSION_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const setCookSession = (session: CookSession) => {
  localStorage.setItem(COOK_SESSION_KEY, JSON.stringify(session));
};

export const clearCookSession = () => {
  localStorage.removeItem(COOK_SESSION_KEY);
};

const loginSchema = z.object({
  mobileNumber: z.string()
    .min(10, 'Mobile number must be 10 digits')
    .max(10, 'Mobile number must be 10 digits')
    .regex(/^\d+$/, 'Mobile number must contain only digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const CookLogin: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      mobileNumber: '',
      password: '',
    },
  });

  // Check if already logged in as cook
  useEffect(() => {
    const session = getCookSession();
    if (session) {
      navigate('/cook/dashboard');
    } else {
      setIsLoading(false);
    }
  }, [navigate]);

  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      // Find cook by mobile number and verify password
      const { data: cook, error: cookError } = await supabase
        .from('cooks')
        .select('id, kitchen_name, mobile_number, panchayat_id, password_hash, is_active')
        .eq('mobile_number', data.mobileNumber)
        .maybeSingle();

      if (cookError || !cook) {
        toast({
          title: "Login failed",
          description: "Mobile number not found",
          variant: "destructive",
        });
        return;
      }

      if (!cook.is_active) {
        toast({
          title: "Login failed",
          description: "Your account is inactive. Contact admin.",
          variant: "destructive",
        });
        return;
      }

      // Simple password verification (plain text for now)
      if (cook.password_hash !== data.password) {
        toast({
          title: "Login failed",
          description: "Invalid password",
          variant: "destructive",
        });
        return;
      }

      // Create session
      const session: CookSession = {
        cookId: cook.id,
        kitchenName: cook.kitchen_name,
        mobileNumber: cook.mobile_number,
        panchayatId: cook.panchayat_id,
      };
      setCookSession(session);

      toast({
        title: "Welcome!",
        description: `Logged in as ${cook.kitchen_name}`,
      });
      navigate('/cook/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-4">
      {/* Logo & Brand */}
      <div className="mb-8 text-center">
        <img src={logo} alt="Penny Carbs" className="mx-auto h-20 w-auto mb-2" />
        <p className="text-sm text-muted-foreground">Cook / Food Partner Login</p>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 p-3 rounded-full bg-primary/10 w-fit">
            <ChefHat className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Kitchen Login</CardTitle>
          <CardDescription>Sign in with your mobile number and password</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={form.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter your 10-digit mobile number"
                          className="pl-10"
                          maxLength={10}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Enter password"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground text-center">
        Contact admin if you don't have login credentials
      </p>
    </div>
  );
};

export default CookLogin;
