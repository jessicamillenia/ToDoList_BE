import { BaseProps } from '../../base';

export interface TodoProperties extends BaseProps {
    id: string;
    activity_id: string;
    title: string;
    priority: string;
    is_active: boolean;
}
