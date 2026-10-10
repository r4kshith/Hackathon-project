import Image from "next/image";

const razorpayLogoUrl = "https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg";

export function RazorpayLogo({ className = "" }: { className?: string }) {
  return <Image src={razorpayLogoUrl} alt="Razorpay" className={className} width={118} height={25} unoptimized />;
}
