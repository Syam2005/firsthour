import ThemeProvider from '../components/ThemeProvider';
import Sidebar from '../components/Sidebar';
import './globals.css';

export const metadata = {
  title: 'FirstHour — Onboard any repository',
  description: 'Get an architecture brief, setup checks, and starter tasks for any GitHub repository.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <div className="app-shell">
            <Sidebar />
            <div className="main-content">
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
