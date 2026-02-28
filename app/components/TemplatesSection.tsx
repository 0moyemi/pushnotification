"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Copy, CheckCheck, Plus, X, Edit2, Trash2 } from "lucide-react";

interface Template {
    id: string;
    title: string;
    message: string;
    icon: string;
}

export const defaultTemplates: Template[] = [
    {
        id: '1',
        title: 'New Order Confirmation',
        icon: '✅',
        message: `Hello! 👋\n\nThank you for your order!\n\nWe have received your request and will confirm the details shortly.\n\nOrder Date: [DATE]\nItem: [ITEM]\nPrice: ₦[PRICE]\n\nWe'll get back to you soon!\n\nBest regards,\n[YOUR BUSINESS NAME]`
    },
    {
        id: '2',
        title: 'Order Ready for Delivery',
        icon: '🚚',
        message: `Good day! 🌟\n\nYour order is ready for delivery!\n\nItem: [ITEM]\nTotal: ₦[PRICE]\nDelivery Date: [DATE]\n\nPlease confirm your delivery address.\n\nThank you for your business!\n[YOUR BUSINESS NAME]`
    },
    {
        id: '3',
        title: 'Follow-up message',
        icon: '👣',
        message: `Hi Rita, just checking in.\nI noticed you were interested in our Abaya. \n↓ Check the full collection here ↓\n\nhttps://bikudiratillah-store.vercel.app/\n\nComplete your order at your own convenience, we’d be happy to deliver it to your doorstep.\nAny questions? Just reply to this message.\n\nThank you.`
    },
    {
        id: '4',
        title: 'Order Delivered',
        icon: '🎉',
        message: `Thank you! 🙏\n\nYour order has been delivered successfully!\n\nWe hope you enjoy your purchase.\n\nPlease leave us feedback and tell your friends about us! 😊\n\n[YOUR BUSINESS NAME]`
    },
    {
        id: '5',
        title: 'Product Availability',
        icon: '📦',
        message: `Good day! 👋\n\nWe have the following items available:\n\n• [ITEM 1] - ₦[PRICE]\n• [ITEM 2] - ₦[PRICE]\n• [ITEM 3] - ₦[PRICE]\n\nPlace your order now!\n\nContact us: [PHONE NUMBER]\n[YOUR BUSINESS NAME]`
    },
    {
        id: '6',
        title: 'Thank You Message',
        icon: '🙏',
        message: `Thank you for your patronage! 🌟\n\nWe truly appreciate your business and trust in us.\n\nLooking forward to serving you again!\n\nStay blessed! 🙏\n[YOUR BUSINESS NAME]`
    }
];

export default function TemplatesSection() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [copied, setCopied] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ title: '', icon: '', message: '' });

    useEffect(() => {
        let savedTemplates = null;
        if (typeof window !== "undefined") {
            savedTemplates = localStorage.getItem('messageTemplates');
        }
        if (savedTemplates) {
            setTemplates(JSON.parse(savedTemplates));
        } else {
            setTemplates(defaultTemplates);
            if (typeof window !== "undefined") {
                localStorage.setItem('messageTemplates', JSON.stringify(defaultTemplates));
            }
        }
    }, []);

    useEffect(() => {
        if (templates.length > 0 && typeof window !== "undefined") {
            localStorage.setItem('messageTemplates', JSON.stringify(templates));
        }
    }, [templates]);

    const handleAddTemplate = () => {
        if (!formData.title.trim() || !formData.message.trim()) return;
        const newTemplate: Template = {
            id: Date.now().toString(),
            title: formData.title,
            icon: formData.icon || '💬',
            message: formData.message
        };
        setTemplates([...templates, newTemplate]);
        setFormData({ title: '', icon: '', message: '' });
        setIsAdding(false);
    };

    const handleEditTemplate = () => {
        if (!editingId || !formData.title.trim() || !formData.message.trim()) return;
        setTemplates(templates.map(t =>
            t.id === editingId
                ? { ...t, title: formData.title, icon: formData.icon || t.icon, message: formData.message }
                : t
        ));
        setEditingId(null);
        setFormData({ title: '', icon: '', message: '' });
    };

    const handleDeleteTemplate = (id: string) => {
        if (window.confirm('Are you sure you want to delete this template?')) {
            setTemplates(templates.filter(t => t.id !== id));
        }
    };

    const startEdit = (template: Template) => {
        setEditingId(template.id);
        setFormData({ title: template.title, icon: template.icon, message: template.message });
        setIsAdding(false);
    };

    const cancelForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ title: '', icon: '', message: '' });
    };

    // Copy template to clipboard and open Web Share if available
    const copyToWhatsApp = async (template: Template) => {
        try {
            if (typeof window !== "undefined" && navigator.clipboard) {
                await navigator.clipboard.writeText(template.message);
            }
            setCopied(template.id);
            setTimeout(() => setCopied(null), 2000);
            if (navigator.share) {
                try {
                    await navigator.share({ text: template.message, title: template.title });
                } catch { }
            }
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(100);
            }
        } catch (err) {
            alert('Failed to copy. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-[#050e23] lg:pl-72">
            <div className="p-6 lg:p-8 max-w-3xl mx-auto">
                {/* Section Title */}
                <div className="mb-4">
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 rounded-xl bg-blue-900/30">
                                <MessageSquare size={28} className="text-blue-400" strokeWidth={2.5} />
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-white">Message Templates</h1>
                        </div>
                        <p className="text-blue-200 text-lg">Save and quickly copy WhatsApp message templates</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-800/50 rounded-2xl p-6 mb-6 shadow-lg">
                        <div className="flex items-start gap-3">
                            <Copy size={24} className="text-blue-200 flex-shrink-0 mt-1" />
                            <div>
                                <p className="text-white text-base leading-relaxed">
                                    <strong className="text-lg">Quick Copy:</strong><br />
                                    Tap any template to copy it, then paste into WhatsApp or share directly!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add New Template Button */}
                {!isAdding && !editingId && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full mb-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-lg font-bold py-4 rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Plus size={24} />
                        <span>Add New Template</span>
                    </button>
                )}

                {/* Add/Edit Template Form */}
                {(isAdding || editingId) && (
                    <div className="mb-6 p-6 rounded-xl border-2 bg-[#081f44] border-green-400 shadow-lg">
                        <div className="flex items-center gap-3 mb-5">
                            {editingId ? <Edit2 size={24} className="text-green-500" /> : <Plus size={24} className="text-green-500" />}
                            <h3 className="text-xl font-bold text-white">
                                {editingId ? 'Edit Template' : 'New Template'}
                            </h3>
                        </div>
                        <input
                            type="text"
                            placeholder="Template title (e.g., New Order Confirmation)"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full p-4 text-lg rounded-xl mb-4 border-2 bg-blue-950 border-blue-700 text-white placeholder-blue-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <input
                            type="text"
                            placeholder="Icon (emoji, e.g., ✅ 🚚 📦)"
                            value={formData.icon}
                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                            className="w-full p-4 text-lg rounded-xl mb-4 border-2 bg-blue-950 border-blue-700 text-white placeholder-blue-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <textarea
                            placeholder="Template message..."
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            rows={8}
                            className="w-full p-4 text-lg rounded-xl mb-4 border-2 bg-blue-950 border-blue-700 text-white placeholder-blue-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={cancelForm}
                                className="py-4 text-lg font-bold rounded-xl bg-blue-950 text-white hover:bg-blue-900 active:scale-95 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={editingId ? handleEditTemplate : handleAddTemplate}
                                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 text-lg font-bold rounded-xl active:scale-95 transition-all shadow-md hover:shadow-lg"
                            >
                                {editingId ? 'Save Changes' : 'Add Template'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Templates Grid */}
                <div className="space-y-4">
                    {templates.length === 0 ? (
                        <div className="text-center py-12 bg-blue-950 rounded-xl border-2 border-dashed border-blue-700">
                            <MessageSquare size={48} className="mx-auto mb-3 text-blue-600" />
                            <p className="text-lg text-blue-200">
                                No templates yet. Tap "Add New Template" to create one.
                            </p>
                        </div>
                    ) : (
                        templates.map(template => (
                            <div
                                key={template.id}
                                className="rounded-xl border-2 overflow-hidden shadow-sm hover:shadow-md transition-all bg-blue-950 border-blue-700"
                            >
                                {/* Template Header */}
                                <div className="p-5 bg-blue-950">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{template.icon}</span>
                                        <h3 className="text-lg font-bold flex-1 text-white">
                                            {template.title}
                                        </h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startEdit(template)}
                                                className="p-2 rounded-lg transition-all bg-blue-700 hover:bg-blue-800 text-white"
                                                title="Edit template"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTemplate(template.id)}
                                                className="p-2 rounded-lg transition-all bg-red-700 hover:bg-red-800 text-white"
                                                title="Delete template"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {/* Template Preview */}
                                <div className="p-5">
                                    <pre className="text-sm whitespace-pre-wrap font-sans mb-4 text-blue-200">
                                        {template.message}
                                    </pre>
                                    {/* Copy Button */}
                                    <button
                                        onClick={() => copyToWhatsApp(template)}
                                        className={`w-full py-4 text-lg font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${copied === template.id
                                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                                            : 'bg-gradient-to-r from-blue-700 to-blue-900 text-white hover:from-blue-800 hover:to-blue-950 active:scale-95 shadow-md hover:shadow-lg'
                                            }`}
                                    >
                                        {copied === template.id ? (
                                            <>
                                                <CheckCheck size={24} />
                                                <span>Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={24} />
                                                <span>Copy & Share</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Additional Info */}
                <div className="mt-6 p-5 rounded-xl bg-blue-950 border-2 border-blue-700">
                    <div className="flex items-start gap-3">
                        <MessageSquare size={20} className="text-blue-400" />
                        <p className="text-sm text-blue-200">
                            <strong>Tip:</strong> Replace [ITEM], [PRICE], [DATE], etc. with your actual order details before sending.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
