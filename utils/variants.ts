import { tv } from "tailwind-variants";

export const appContent = tv({
    base: "mx-auto max-w-screen-xl w-full",
    variants: {
        padding: {
            no: "px-0",
            sm: "px-3 sm:px-5",
            base: "px-6 sm:px-10",
            lg: "px-6 sm:px-[15vw] lg:px-20",
            xl: "px-6 sm:px-[20vw] lg:px-40",
        },
        rmMargin: {
            sm: "-mx-6 sm:-mx-3",
            base: "-mx-6 sm:-mx-10",
            lg: "-mx-6 sm:-mx-[15vw] lg:-mx-20",
        },
    },
    defaultVariants: {
        padding: "sm",
    },
});