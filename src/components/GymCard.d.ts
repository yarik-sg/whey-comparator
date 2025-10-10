import type { GymLocation } from '../lib/gymLocator';
import type { MemoExoticComponent, ReactElement } from 'react';

export interface GymCardProps {
  gym: GymLocation;
}

export declare const GymCard: MemoExoticComponent<(props: GymCardProps) => ReactElement>;
