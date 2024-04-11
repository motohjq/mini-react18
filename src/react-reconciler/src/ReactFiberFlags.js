export const NoFlags = 0b00000000000000000000000000;//0
export const Placement = 0b00000000000000000000000010;//2
export const Update = 0b00000000000000000000000100;//4
export const ChildDeletion = 0b00000000000000000000001000;//8
export const Ref = 0b00000000000000000100000000;//256
export const MutationMask = Placement | Update | ChildDeletion | Ref;
//如果函数组件里面使用了useEffect，那么此函数组件对应的fiber上会有一个Passive标记，
export const Passive = 0b00000000000000010000000000;//1024
export const LayoutMask = Update;