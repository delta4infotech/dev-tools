import Header from "@/components/header";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen w-full flex flex-col bg-background">
            {/* <Navbar /> */}
            <Header />
            {children}
        </div>
    )
}