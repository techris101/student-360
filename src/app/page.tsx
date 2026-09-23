export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-full max-w-xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          Student <span className="text-[#0F6E56]">360</span>
        </h1>
        <p className="text-lg leading-relaxed text-neutral-700">
          Every opportunity open to Rwandan university students, checked against your
          profile.
        </p>
        <div className="pt-4">
          <span className="inline-block rounded-md border border-neutral-300 bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700">
            System initialization in progress (V1 Build)
          </span>
        </div>
      </div>
    </main>
  );
}
