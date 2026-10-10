import { redirect } from 'next/navigation';

export default function DashboardRedirect() {
  redirect('/dept/dashboard');
}
