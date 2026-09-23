import React from 'react';
import {
  Home,
  ShoppingCart,
  Utensils,
  Car,
  Zap,
  Tv,
  HeartPulse,
  ShoppingBag,
  GraduationCap,
  Plane,
  Briefcase,
  Code,
  TrendingUp,
  Award,
  Tag,
  Gift,
  Coffee,
  Smartphone,
  Shield,
  HelpCircle,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Home,
  ShoppingCart,
  Utensils,
  Car,
  Zap,
  Tv,
  HeartPulse,
  ShoppingBag,
  GraduationCap,
  Plane,
  Briefcase,
  Code,
  TrendingUp,
  Award,
  Tag,
  Gift,
  Coffee,
  Smartphone,
  Shield,
};

interface CategoryIconProps {
  iconName: string;
  color?: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconName,
  color,
  className = 'w-5 h-5',
}) => {
  const IconComponent = ICON_MAP[iconName] || Tag;

  return (
    <span
      className="inline-flex items-center justify-center p-2 rounded-lg"
      style={{
        backgroundColor: color ? `${color}18` : '#F3F4F6',
        color: color || '#4B5563',
      }}
    >
      <IconComponent className={className} />
    </span>
  );
};

export const AVAILABLE_ICONS = [
  'Home',
  'ShoppingCart',
  'Utensils',
  'Car',
  'Zap',
  'Tv',
  'HeartPulse',
  'ShoppingBag',
  'GraduationCap',
  'Plane',
  'Briefcase',
  'Code',
  'TrendingUp',
  'Award',
  'Tag',
  'Gift',
  'Coffee',
  'Smartphone',
  'Shield',
];
