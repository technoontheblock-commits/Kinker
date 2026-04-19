import Image from 'next/image'

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`w-[120px] h-[90px] ${className}`}>
      <Image
        src="/images/logo.png"
        alt="KINKER"
        width={120}
        height={90}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  )
}

export function LogoIcon({ className = "" }: { className?: string }) {
  return (
    <div className={`${className}`}>
      <Image
        src="/images/logo.png"
        alt="KINKER"
        width={100}
        height={75}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  )
}
