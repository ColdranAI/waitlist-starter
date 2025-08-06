'use client';

export function Register() {
  return (
    <div className="max-w-fit items-center justify-center max-sm:hidden">
      <a 
        href="https://coldran.com/" 
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-pointer"
      >
        <div className="font-bold rounded-md border p-1 bg-background hover:-translate-y-[1px] transition-all duration-200">
          <div className="rounded-md px-2 py-0.5 font-mono text-[11.5px] text-foreground">
            Coldran OSS Project
          </div>
        </div>
      </a>
    </div>
  );
}