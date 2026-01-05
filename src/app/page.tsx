
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to login instead of dashboard
  redirect('/login');
}
