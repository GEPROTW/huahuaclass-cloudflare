
import React, { useState, useMemo } from 'react';
import { Inquiry, AppUser } from '../types';
import { Search, Phone, Calendar, Mail, User, Clock, CheckCircle, AlertCircle, MessageSquare, X, Edit2, Save } from 'lucide-react';

interface InquiryViewProps {
    inquiries: Inquiry[];
    onUpdateInquiry: (inquiry: Inquiry) => void;
    readOnly?: boolean;
    currentUser: AppUser;
}

export const InquiryView: React.FC<InquiryViewProps> = ({ inquiries, onUpdateInquiry, readOnly = false, currentUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'contacted' | 'closed'>('all');
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
    const [editNote, setEditNote] = useState('');
    const [editStatus, setEditStatus] = useState<Inquiry['status']>('new');

    const filteredInquiries = useMemo(() => {
        return inquiries.filter(inq => {
            const matchesSearch = inq.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  inq.phone.includes(searchTerm);
            const matchesStatus = statusFilter === 'all' || inq.status === statusFilter;
            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [inquiries, searchTerm, statusFilter]);

    const handleOpenEdit = (inquiry: Inquiry) => {
        setSelectedInquiry(inquiry);
        setEditNote(inquiry.adminNotes || '');
        setEditStatus(inquiry.status);
    };

    const handleSave = () => {
        if (!selectedInquiry) return;

        const updatedInquiry: Inquiry = {
            ...selectedInquiry,
            status: editStatus,
            adminNotes: editNote,
            // If status changed to contacted or notes updated, update timestamp
            lastContactedAt: new Date().toISOString(),
            lastContactedBy: currentUser.name
        };

        onUpdateInquiry(updatedInquiry);
        setSelectedInquiry(null);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200 flex items-center w-fit"><AlertCircle className="w-3 h-3 mr-1"/>新預約</span>;
            case 'contacted': return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200 flex items-center w-fit"><Clock className="w-3 h-3 mr-1"/>追蹤中</span>;
            case 'closed': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200 flex items-center w-fit"><CheckCircle className="w-3 h-3 mr-1"/>已結案</span>;
            default: return null;
        }
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return '-';
        const d = new Date(isoString);
        return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">預約諮詢管理</h2>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                        {(['all', 'new', 'contacted', 'closed'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${statusFilter === status ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                {status === 'all' ? '全部' : (status === 'new' ? '新預約' : (status === 'contacted' ? '追蹤中' : '已結案'))}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="搜尋姓名或電話..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48 shadow-sm h-10 text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">狀態</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">預約時間</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">姓名 / 電話</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">感興趣課程</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">最後處理</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredInquiries.map(inq => (
                            <tr key={inq.id} className="hover:bg-gray-50 group">
                                <td className="px-6 py-4">{getStatusBadge(inq.status)}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(inq.createdAt)}</td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-800">{inq.name}</div>
                                    <div className="text-xs text-gray-500 flex items-center mt-0.5"><Phone className="w-3 h-3 mr-1"/>{inq.phone}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">{inq.subject}</span>
                                    {inq.message && <div className="text-xs text-gray-400 mt-1 truncate max-w-[150px]">{inq.message}</div>}
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500">
                                    {inq.lastContactedAt ? (
                                        <div>
                                            <div className="font-medium text-slate-700">{inq.lastContactedBy}</div>
                                            <div className="text-[10px]">{formatDate(inq.lastContactedAt)}</div>
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleOpenEdit(inq)}
                                        className="text-gray-400 hover:text-blue-600 p-1 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow transition-all"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredInquiries.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-400">目前沒有相關預約資料</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit/Process Modal */}
            {selectedInquiry && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row h-[70vh] md:h-auto">
                        {/* Left: Customer Info (Read Only) */}
                        <div className="w-full md:w-2/5 bg-slate-50 border-r border-slate-100 p-6 overflow-y-auto">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                                <User className="w-5 h-5 mr-2 text-slate-500" />
                                預約者資料
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">姓名</label>
                                    <div className="text-base font-bold text-slate-800">{selectedInquiry.name}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">電話</label>
                                    <div className="text-base text-slate-700 flex items-center"><Phone className="w-4 h-4 mr-2 text-slate-400"/>{selectedInquiry.phone}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">諮詢課程</label>
                                    <div className="text-base text-blue-600 font-medium">{selectedInquiry.subject}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">留言內容</label>
                                    <div className="mt-2 p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 leading-relaxed min-h-[80px]">
                                        {selectedInquiry.message || '無留言'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">提交時間</label>
                                    <div className="text-xs text-slate-500 mt-1">{formatDate(selectedInquiry.createdAt)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Processing Form */}
                        <div className="w-full md:w-3/5 flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                    <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                                    回訪紀錄與處理
                                </h3>
                                <button onClick={() => setSelectedInquiry(null)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="p-6 flex-1 space-y-6 overflow-y-auto">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">處理狀態</label>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setEditStatus('new')} 
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${editStatus === 'new' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            新預約
                                        </button>
                                        <button 
                                            onClick={() => setEditStatus('contacted')} 
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${editStatus === 'contacted' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            追蹤中
                                        </button>
                                        <button 
                                            onClick={() => setEditStatus('closed')} 
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${editStatus === 'closed' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            已結案
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">內部備註 / 回訪紀錄</label>
                                    <textarea 
                                        className="w-full h-32 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm leading-relaxed"
                                        placeholder="請記錄聯絡狀況、家長需求或其他注意事項..."
                                        value={editNote}
                                        onChange={(e) => setEditNote(e.target.value)}
                                    />
                                    <div className="text-xs text-slate-400 mt-2 text-right">
                                        更新時將自動記錄您的姓名 ({currentUser.name}) 與時間
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                <button onClick={() => setSelectedInquiry(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium">
                                    取消
                                </button>
                                <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-bold flex items-center">
                                    <Save className="w-4 h-4 mr-2" />
                                    儲存紀錄
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
