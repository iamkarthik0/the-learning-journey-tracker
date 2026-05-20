export function TypographyH1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
      {children}
    </h1>
  );
}

export function TypographyH2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="scroll-m-20 border-b pb-2 text-xl font-semibold tracking-tight first:mt-0 sm:text-2xl md:text-3xl">
      {children}
    </h2>
  );
}

export function TypographyH3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="scroll-m-20 text-lg font-semibold tracking-tight sm:text-xl md:text-2xl">
      {children}
    </h3>
  );
}

export function TypographyH4({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="scroll-m-20 text-base font-semibold tracking-tight sm:text-lg md:text-xl">
      {children}
    </h4>
  );
}

export function TypographyP({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-7 sm:text-base [&:not(:first-child)]:mt-4 sm:[&:not(:first-child)]:mt-6">
      {children}
    </p>
  );
}

export function TypographyBlockquote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="mt-4 border-l-2 pl-4 text-sm italic sm:mt-6 sm:pl-6 sm:text-base">
      {children}
    </blockquote>
  );
}

export function TypographyList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="my-4 ml-4 list-disc text-sm sm:my-6 sm:ml-6 sm:text-base [&>li]:mt-2">
      {children}
    </ul>
  );
}

export function TypographyInlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
      {children}
    </code>
  );
}

export function TypographyLead({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-base text-muted-foreground sm:text-lg md:text-xl">
      {children}
    </p>
  );
}

export function TypographyLarge({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-base font-semibold sm:text-lg">
      {children}
    </div>
  );
}

export function TypographySmall({ children }: { children: React.ReactNode }) {
  return (
    <small className="text-sm font-medium leading-none">
      {children}
    </small>
  );
}

export function TypographyMuted({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export function TypographyTable() {
  return (
    <div className="my-4 w-full overflow-y-auto sm:my-6">
      <table className="w-full text-sm sm:text-base">
        <thead>
          <tr className="m-0 border-t p-0 even:bg-muted">
            <th className="border px-2 py-1 text-left font-bold sm:px-4 sm:py-2 [&[align=center]]:text-center [&[align=right]]:text-right">
              King's Treasury
            </th>
            <th className="border px-2 py-1 text-left font-bold sm:px-4 sm:py-2 [&[align=center]]:text-center [&[align=right]]:text-right">
              People's happiness
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="m-0 border-t p-0 even:bg-muted">
            <td className="border px-2 py-1 text-left sm:px-4 sm:py-2 [&[align=center]]:text-center [&[align=right]]:text-right">
              Empty
            </td>
            <td className="border px-2 py-1 text-left sm:px-4 sm:py-2 [&[align=center]]:text-center [&[align=right]]:text-right">
              Overflowing
            </td>
          </tr>
          <tr className="m-0 border-t p-0 even:bg-muted">
            <td className="border px-2 py-1 text-left sm:px-4 sm:py-2 [&[align=center]]:text-center [&[align=right]]:text-right">
              Modest
            </td>
            <td className="border px-2 py-1 text-left sm:px-4 sm:py-2 [&[align=center]]:text-center [&[align=right]]:text-right">
              Satisfied
            </td>
          </tr>
          <tr className="m-0 border-t p-0 even:bg-muted">
            <td className="border px-2 py-1 text-left sm:px-4 sm:py-2 [&[align=center]]:text-center [&[align=right]]:text-right">
              Full
            </td>
            <td className="border px-2 py-1 text-left sm:px-4 sm:py-2 [&[align=center]]:text-center [&[align=right]]:text-right">
              Ecstatic
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
