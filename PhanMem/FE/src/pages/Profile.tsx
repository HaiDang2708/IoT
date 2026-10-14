import React, { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '../components/Common/Card';
import {
  Globe,
  User,
  GraduationCap,
  MapPin,
  Calendar,
  Clock,
  Phone,
  BookOpen,
  Shield,
  UserCheck,
  Mail,
  Award,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

// Helper formatting functions
const YYYYMMDD_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const formatDateToDDMMYYYY = (dateStr: string) => {
  if (!dateStr) return '';
  const match = dateStr.match(YYYYMMDD_REGEX);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : dateStr;
};

const getHref = (url?: string, defaultDomain = '') => {
  if (!url) return '';
  const cleanUrl = url.trim();
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) return cleanUrl;
  return `https://${defaultDomain}/${cleanUrl}`;
};

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const GoogleDriveIcon: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 10 6 20l-3-5 6-10z" />
    <path d="M9 15h12l-3 5H6z" />
    <path d="m15 15-6-10h6l6 10z" />
  </svg>
);

const PostmanIcon: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

const FigmaIcon: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
    <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
    <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" />
    <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
    <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
  </svg>
);

// COMPONENT TÁI SỬ DỤNG CHO CỘT 1 & CỘT 2
interface InfoItemProps {
  label: string;
  value: string;
  icon: LucideIcon;
  bgIconColor: string;
  iconColor: string;
  title?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({
  label,
  value,
  icon: Icon,
  bgIconColor,
  iconColor,
  title,
}) => (
  <div className="p-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2.5 transition">
    <div className={`flex h-7.5 w-7.5 items-center justify-center rounded-lg ${bgIconColor} ${iconColor} shrink-0`}>
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0 flex-1">
      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-xs font-bold text-slate-800 tracking-tight block truncate" title={title || value}>
        {value}
      </span>
    </div>
  </div>
);

// COMPONENT TÁI SỬ DỤNG CHO CỘT 3  
interface ResourceLinkProps {
  label: string;
  name: string;
  url?: string;
  defaultDomain: string;
  icon: React.ReactNode;
  bgIcon: string;
  iconColor: string;
  hoverBorder: string;
  hoverText: string;
  activeColor?: string;
}

const ResourceLink: React.FC<ResourceLinkProps> = ({
  label,
  name,
  url,
  defaultDomain,
  icon,
  bgIcon,
  iconColor,
  hoverBorder,
  hoverText,
  activeColor,
}) => {
  const href = getHref(url, defaultDomain);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={url ? href : undefined}
      className={`p-3 sm:p-3.5 bg-slate-50/70 hover:bg-slate-100/90 border border-slate-100 ${hoverBorder} rounded-xl flex items-center justify-between gap-3 transition group flex-1`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${bgIcon} ${iconColor} transition shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
          <span className={`text-xs sm:text-[13px] font-bold ${activeColor || 'text-slate-800'} ${hoverText} truncate block transition`}>
            {url ? name : 'Chưa liên kết'}
          </span>
        </div>
      </div>
      <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-800 shrink-0 transition" />
    </a>
  );
};

// TRANG THÔNG TIN CÁ NHÂN (Giữ nguyên 100% giao diện Bài 3)
export const ProfilePage: React.FC = () => {
  const { userProfile: user } = useApp();
  const birthday = formatDateToDDMMYYYY(user.birthday);

  // Mảng dữ liệu Cột 1: Học tập
  const academicItems: InfoItemProps[] = useMemo(() => [
    { label: 'Mã số sinh viên', value: user.mssv || 'B23DCAT036', icon: GraduationCap, bgIconColor: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Lớp hành chính', value: user.lopHanhChinh || 'D23CQAT01-B', icon: BookOpen, bgIconColor: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    { label: 'Khoa đào tạo', value: user.khoa || 'An Toàn Thông Tin', icon: Shield, bgIconColor: 'bg-sky-50', iconColor: 'text-sky-600' },
    { label: 'Giảng viên hướng dẫn', value: user.giangVienHuongDan || 'TS Nguyễn Quốc Uy', icon: UserCheck, bgIconColor: 'bg-violet-50', iconColor: 'text-violet-600' },
    { label: 'Hệ đào tạo', value: 'Đại học chính quy', icon: Award, bgIconColor: 'bg-amber-50', iconColor: 'text-amber-600' },
    { label: 'Cơ sở đào tạo', value: 'Học viện CNBCVT - PTIT Hà Nội', icon: Building2, bgIconColor: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  ], [user]);

  // Mảng dữ liệu Cột 2: Cá nhân
  const personalItems: InfoItemProps[] = useMemo(() => [
    { label: 'Ngày sinh', value: birthday || '27/08/2005', icon: Calendar, bgIconColor: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    { label: 'Giới tính', value: user.gioiTinh || 'Nam', icon: User, bgIconColor: 'bg-pink-50', iconColor: 'text-pink-600' },
    { label: 'Số điện thoại', value: user.phone || '0334296045', icon: Phone, bgIconColor: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Địa chỉ Email', value: user.email || 'dang8@gmail.com', icon: Mail, bgIconColor: 'bg-violet-50', iconColor: 'text-violet-600', title: user.email },
    { label: 'Múi giờ hệ thống', value: user.muiGio || 'Việt Nam (GMT+7)', icon: Clock, bgIconColor: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { label: 'Địa chỉ liên hệ', value: user.diaChi || 'Yên Xá - Thanh Liệt - Hà Nội', icon: MapPin, bgIconColor: 'bg-rose-50', iconColor: 'text-rose-600' },
  ], [user, birthday]);

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between space-y-3.5 overflow-y-auto animate-in fade-in duration-200">
      {/* 1. BANNER NGANG VỚI ẢNH TRƯỜNG PTIT */}
      <div className="h-32 sm:h-36 rounded-2xl relative overflow-hidden flex items-center justify-between px-6 sm:px-8 shadow-sm border border-slate-200/60 shrink-0">
        <img
          src="/truong.png"
          alt="Trường PTIT"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-slate-900/50 pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 min-w-0">
          <div className="relative shrink-0">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-3 border-white/95 shadow-lg bg-slate-100 overflow-hidden flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover object-center rounded-full" />
              ) : (
                <User className="h-10 w-10 text-slate-400" />
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 border-2 border-white shadow-xs">
              <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </div>
          </div>

          <div className="min-w-0 space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug drop-shadow-sm truncate">
              {user.fullName || 'Đặng Trần Hải Đăng'}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-white/90 border border-white/20">
                {user.mssv || 'B23DCAT036'}
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-white/90 border border-white/20">
                {user.lopHanhChinh || 'D23CQAT01-B'}
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-white/90 border border-white/20 hidden sm:inline-block">
                {user.khoa || 'An Toàn Thông Tin'} • Học viện PTIT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KHU VỰC 3 CỘT THÔNG TIN CHÍNH */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 flex-1 min-h-0">
        {/* CỘT 1: THÔNG TIN HỌC VẤN */}
        <Card title="Học tập" description="Thông tin chương trình đào tạo" className="h-full flex flex-col min-h-0">
          <div className="space-y-2 flex-1 flex flex-col justify-around py-0.5">
            {academicItems.map((item) => (
              <InfoItem key={item.label} {...item} />
            ))}
          </div>
        </Card>

        {/* CỘT 2: THÔNG TIN LIÊN HỆ & CÁ NHÂN */}
        <Card title="Cá nhân" description="Thông tin liên lạc & vị trí" className="h-full flex flex-col min-h-0">
          <div className="space-y-2 flex-1 flex flex-col justify-around py-0.5">
            {personalItems.map((item) => (
              <InfoItem key={item.label} {...item} />
            ))}
          </div>
        </Card>

        {/* CỘT 3: TÀI LIỆU DỰ ÁN & LIÊN KẾT NỀN TẢNG */}
        <Card title="Tài liệu" description="Liên kết tài nguyên hệ thống" className="h-full flex flex-col min-h-0">
          <div className="space-y-2.5 flex-1 flex flex-col justify-around py-0.5">
            <ResourceLink
              label="Source Code"
              name="GitHub Repository"
              url={user.github || 'https://github.com/HaiDang2708/IoT'}
              defaultDomain="github.com"
              icon={<GithubIcon className="h-4 w-4" />}
              bgIcon="bg-slate-900 group-hover:bg-slate-800"
              iconColor="text-white"
              hoverBorder="hover:border-slate-300"
              hoverText="group-hover:text-slate-900"
            />

            <ResourceLink
              label="Báo cáo"
              name="Google Drive Folder"
              url={user.drive || 'https://drive.google.com'}
              defaultDomain="drive.google.com"
              icon={<GoogleDriveIcon className="h-4 w-4" />}
              bgIcon="bg-emerald-50 group-hover:bg-emerald-100/80"
              iconColor="text-emerald-600"
              hoverBorder="hover:border-emerald-200"
              hoverText="group-hover:text-emerald-700"
            />

            <ResourceLink
              label="Tài liệu API"
              name="Postman Documenter"
              url={user.apiDoc || 'https://documenter.getpostman.com'}
              defaultDomain="documenter.getpostman.com"
              icon={<PostmanIcon className="h-4 w-4" />}
              bgIcon="bg-amber-50 group-hover:bg-amber-100/80"
              iconColor="text-amber-600"
              hoverBorder="hover:border-amber-200"
              hoverText="group-hover:text-amber-700"
            />

            <ResourceLink
              label="Thiết kế UI/UX"
              name="Figma Prototype"
              url={user.figma || 'https://figma.com'}
              defaultDomain="figma.com"
              icon={<FigmaIcon className="h-4 w-4" />}
              bgIcon="bg-violet-50 group-hover:bg-violet-100/80"
              iconColor="text-violet-600"
              hoverBorder="hover:border-violet-200"
              hoverText="group-hover:text-violet-700"
            />
          </div>
        </Card>
      </div>
    </div>
  );
};
