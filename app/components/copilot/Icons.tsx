import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return <IconBase {...props}><path d="m12 3 1.35 4.15a5.5 5.5 0 0 0 3.5 3.5L21 12l-4.15 1.35a5.5 5.5 0 0 0-3.5 3.5L12 21l-1.35-4.15a5.5 5.5 0 0 0-3.5-3.5L3 12l4.15-1.35a5.5 5.5 0 0 0 3.5-3.5L12 3Z" /></IconBase>;
}

export function PlusIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 5v14M5 12h14" /></IconBase>;
}

export function MenuIcon(props: IconProps) {
  return <IconBase {...props}><path d="M4 7h16M4 12h16M4 17h16" /></IconBase>;
}

export function CloseIcon(props: IconProps) {
  return <IconBase {...props}><path d="m6 6 12 12M18 6 6 18" /></IconBase>;
}

export function ChatIcon(props: IconProps) {
  return <IconBase {...props}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" /></IconBase>;
}

export function SendIcon(props: IconProps) {
  return <IconBase {...props}><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="M22 2 11 13" /></IconBase>;
}

export function PackageIcon(props: IconProps) {
  return <IconBase {...props}><path d="m21 8-9 5-9-5 9-5 9 5Z" /><path d="m3 8 9 5v9l9-5V8M12 13v9" /></IconBase>;
}

export function UserIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></IconBase>;
}

export function ClipboardIcon(props: IconProps) {
  return <IconBase {...props}><path d="M9 5H6a2 2 0 0 0-2 2v13h16V7a2 2 0 0 0-2-2h-3" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M8 12h8M8 16h5" /></IconBase>;
}

export function ShieldIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></IconBase>;
}

export function BookIcon(props: IconProps) {
  return <IconBase {...props}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" /><path d="M8 8h8M8 12h6" /></IconBase>;
}

export function BoltIcon(props: IconProps) {
  return <IconBase {...props}><path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" /></IconBase>;
}

export function CheckIcon(props: IconProps) {
  return <IconBase {...props}><path d="m5 12 4 4L19 6" /></IconBase>;
}

export function MoreIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></IconBase>;
}
