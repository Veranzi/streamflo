import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-blue-900 text-white mt-12">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <Image src="/Logo.png" width={64} height={64} alt="Streamflo" className="w-16 mb-3 object-contain" />
          <p>© {year} Streamflo</p>
          <p className="text-sm text-blue-200 mt-1">Find Schools in Kenya</p>
        </div>

        <div>
          <h3 className="font-bold">Explore</h3>
          <ul className="mt-3 space-y-2">
            <li><Link href="/directory" className="hover:underline">Directory</Link></li>
            <li><Link href="/register" className="hover:underline">Register School</Link></li>
            <li><Link href="/blog" className="hover:underline">Blog</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold">Contact</h3>
          <p className="mt-3 break-words">Phone: 0783 601 773</p>
          <p>Email: info@streamflo.co.ke</p>
          <p className="text-sm mt-2">Paybill: 802200 • Account: 0022020006871</p>
        </div>

        <div>
          <h3 className="font-bold">Packages</h3>
          <p className="mt-3">Starter • Premium • Enterprise</p>
          <Link href="/register?package=premium" className="mt-3 inline-block bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
            Go Premium
          </Link>
        </div>
      </div>
    </footer>
  );
}
