export const NoFlags = 0b0000;
//有effect 有这个flag才会执行effect
export const HasEffect = 0b0001;
export const Insertion = 0b0010;
//是useEffect
export const Passive = 0b1000;
//是useLayoutEffect
export const Layout = 0b0100;