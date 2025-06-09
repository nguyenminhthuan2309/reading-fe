import Link from "next/link";
import { Github, Twitter, Instagram } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-[#FFB371] dark:bg-yellow-900/20 border-t py-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="Haru's Library Logo" 
                width={24} 
                height={24} 
                className="mr-2"
              />
              <span className="font-bold text-xl">Haru's Library</span>
            </div>
            <p className="text-muted-foreground text-sm">
              A platform for book lovers to discover, read, and share their favorite books.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/browse" className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Genres
                </Link>
              </li>
              <li>
                <Link href="/collections" className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Collections
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/copyright" className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Copyright
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Connect</h3>
            <div className="flex space-x-3">
              <Link href="https://github.com" className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link href="https://twitter.com" className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="https://instagram.com" className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Haru's Library. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground mt-2 md:mt-0">
            Made with ♥ for book enthusiasts everywhere
          </p>
        </div>
      </div>
    </footer>
  );
} 