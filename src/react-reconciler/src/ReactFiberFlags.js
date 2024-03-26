export const NoFlags = 0b00000000000000000000000000;//0
export const Placement = 0b00000000000000000000000010;//2
export const Update = 0b00000000000000000000000100;//4
export const ChildDeletion = 0b00000000000000000000001000;//8
export const MutationMask = Placement | Update | ChildDeletion;