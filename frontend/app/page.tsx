'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Terminal,
  ArrowRight,
  ArrowUpRight,
  Search,
  Menu,
  X,
  Zap,
  Shield,
  Cpu,
  Layers,
  CheckCircle2,
  ChevronDown,
  MessageSquare,
  Users,
  Code,
  Lock,
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#111214] text-[#F2F3F5] selection:bg-[#5865F2] selection:text-white flex flex-col font-sans">
      {/* TOP ANNOUNCEMENT BAR */}
      <div className="bg-[#17181B] border-b border-[#26282D] py-2 px-4 text-center text-xs text-[#949BA4]">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/25">
            RILIS v2.14
          </span>
          <span>
            Engine WebSocket berbasis Go 1.25 menurunkan latensi pesan P99 hingga{' '}
            <strong className="text-[#F2F3F5] font-mono">14ms</strong>.
          </span>
          <a
            href="#architecture"
            className="text-[#F2F3F5] hover:text-[#5865F2] underline underline-offset-4 font-medium inline-flex items-center gap-1 transition-colors"
          >
            <span>Baca arsitektur</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* STICKY NAVBAR */}
      <header className="sticky top-0 z-40 h-16 bg-[#111214]/90 backdrop-blur-md border-b border-[#26282D]">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#2B2D31] border border-[#26282D] group-hover:border-[#5865F2]/60 flex items-center justify-center transition-colors">
              <Terminal className="w-4 h-4 text-[#5865F2]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-[#F2F3F5]">GoChat</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[#949BA4] bg-[#17181B] border border-[#26282D] rounded">
                v2.14
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm text-[#949BA4]">
            <a href="#preview" className="hover:text-[#F2F3F5] transition-colors">Preview Produk</a>
            <a href="#features" className="hover:text-[#F2F3F5] transition-colors">Fitur Engineering</a>
            <a href="#architecture" className="hover:text-[#F2F3F5] transition-colors">Arsitektur</a>
            <a href="#pricing" className="hover:text-[#F2F3F5] transition-colors">Harga</a>
            <a href="#faq" className="hover:text-[#F2F3F5] transition-colors">FAQ</a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="h-9 px-3.5 rounded-lg text-xs font-medium text-[#949BA4] hover:text-[#F2F3F5] transition-colors flex items-center"
            >
              Masuk
            </Link>
            <Link
              href="/app"
              className="h-9 px-4 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-xs font-medium text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Buka Web App</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[#17181B] border border-[#26282D] text-[#949BA4] hover:text-[#F2F3F5]"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#17181B] border-b border-[#26282D] px-4 pt-3 pb-5 space-y-3">
            <div className="flex flex-col space-y-2 text-sm text-[#949BA4]">
              <a href="#preview" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[#F2F3F5]">Preview Produk</a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[#F2F3F5]">Fitur Engineering</a>
              <a href="#architecture" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[#F2F3F5]">Arsitektur</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[#F2F3F5]">Harga</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[#F2F3F5]">FAQ</a>
            </div>
            <div className="pt-2 border-t border-[#26282D] flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full h-9 rounded-lg bg-[#2B2D31] text-xs font-medium text-[#F2F3F5] border border-[#26282D] flex items-center justify-center"
              >
                Masuk ke Akun
              </Link>
              <Link
                href="/app"
                className="w-full h-9 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-xs font-medium text-white flex items-center justify-center gap-1.5"
              >
                <span>Buka Web App</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-14 pb-20 sm:pt-20 sm:pb-28 bg-grid-pattern border-b border-[#26282D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#17181B] border border-[#26282D] text-xs text-[#949BA4] mb-6">
              <span className="w-2 h-2 rounded-full bg-[#23A55A] animate-pulse"></span>
              <span>Dirancang untuk komunitas developer & tim engineering modern</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F2F3F5] leading-tight sm:leading-none">
              Kolaborasi Real-Time Tanpa Hambatan Latensi.
            </h1>

            <p className="mt-6 text-base sm:text-lg text-[#949BA4] leading-relaxed max-w-2xl mx-auto">
              GoChat menggabungkan server komunitas, diskusi terstruktur per channel, dan direct message dengan performa backend Go berkekuatan penuh.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/app"
                className="w-full sm:w-auto h-11 px-6 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#5865F2]/20"
              >
                <span>Buka Aplikasi Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto h-11 px-6 rounded-lg bg-[#17181B] hover:bg-[#2B2D31] border border-[#26282D] text-sm font-medium text-[#F2F3F5] transition-colors flex items-center justify-center gap-2"
              >
                <span>Daftar Akun Baru</span>
              </Link>
            </div>

            {/* Terminal Quick Start Snippet */}
            <div className="mt-10 max-w-lg mx-auto bg-[#17181B] border border-[#26282D] rounded-xl p-3 text-left shadow-xl">
              <div className="flex items-center justify-between text-xs text-[#949BA4] mb-2 px-1">
                <span className="flex items-center gap-1.5 font-mono">
                  <Terminal className="w-3.5 h-3.5 text-[#5865F2]" />
                  <span>Jalankan dengan Docker</span>
                </span>
                <span className="text-[10px] bg-[#2B2D31] px-1.5 py-0.5 rounded text-[#949BA4]">docker compose</span>
              </div>
              <div className="bg-[#111214] rounded-lg p-2.5 font-mono text-xs text-[#23A55A] overflow-x-auto select-all">
                git clone https://github.com/gochat/gochat.git &amp;&amp; docker compose up -d
              </div>
            </div>
          </div>

          {/* PRODUCT PREVIEW MOCKUP */}
          <div id="preview" className="mt-16 sm:mt-20 max-w-6xl mx-auto">
            <div className="rounded-2xl border border-[#26282D] bg-[#17181B] shadow-2xl overflow-hidden">
              {/* Window Title Bar */}
              <div className="h-10 bg-[#111214] border-b border-[#26282D] px-4 flex items-center justify-between text-xs text-[#949BA4]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#F23F43]"></span>
                  <span className="w-3 h-3 rounded-full bg-[#F0B232]"></span>
                  <span className="w-3 h-3 rounded-full bg-[#23A55A]"></span>
                  <span className="ml-2 font-mono text-[11px] text-[#949BA4]">gochat.app/app — DevSpace Workspace</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#23A55A]"></span>
                  <span>100% Real-Time Connected</span>
                </div>
              </div>

              {/* Mockup Preview Area */}
              <div className="h-96 sm:h-[480px] bg-[#222327] flex overflow-hidden">
                {/* Server Rail */}
                <div className="w-16 bg-[#111214] border-r border-[#26282D] flex flex-col items-center py-3 gap-2.5 shrink-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#5865F2] flex items-center justify-center text-white font-bold text-xs shadow">
                    GC
                  </div>
                  <div className="w-8 h-[1px] bg-[#26282D]"></div>
                  <div className="w-10 h-10 rounded-xl bg-[#2B2D31] flex items-center justify-center text-xs font-semibold text-[#F2F3F5]">
                    DS
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#2B2D31] flex items-center justify-center text-xs font-semibold text-[#949BA4]">
                    GO
                  </div>
                </div>

                {/* Channel List */}
                <div className="w-52 bg-[#17181B] border-r border-[#26282D] hidden sm:flex flex-col p-3 space-y-3 shrink-0">
                  <div className="font-semibold text-sm text-[#F2F3F5] flex items-center justify-between pb-2 border-b border-[#26282D]">
                    <span>DevSpace</span>
                    <span className="text-[10px] bg-[#5865F2]/20 text-[#5865F2] px-1.5 py-0.5 rounded font-mono">PRO</span>
                  </div>
                  <div className="text-[11px] font-bold text-[#949BA4] uppercase tracking-wider">CHANNELS</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#2B2D31] text-white font-medium">
                      <span>#</span> general
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded text-[#949BA4] hover:text-white">
                      <span>#</span> backend-go
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded text-[#949BA4] hover:text-white">
                      <span>#</span> architecture
                    </div>
                  </div>
                </div>

                {/* Chat Mock */}
                <div className="flex-1 flex flex-col justify-between p-4 bg-[#222327]">
                  <div className="space-y-4 overflow-hidden">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        AW
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#F2F3F5]">Arya Wijaya</span>
                          <span className="text-[10px] text-[#949BA4]">Hari ini pukul 10:14</span>
                        </div>
                        <p className="text-xs text-[#F2F3F5] mt-1 bg-[#2B2D31]/40 p-2 rounded border border-[#26282D]">
                          Goroutine worker pool berhasil menurunkan memory overhead hingga 40%. Semua benchmark lulus k6!
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#23A55A] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        BS
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#F2F3F5]">Budi Santoso</span>
                          <span className="text-[10px] text-[#949BA4]">Hari ini pukul 10:15</span>
                        </div>
                        <p className="text-xs text-[#F2F3F5] mt-1 bg-[#2B2D31]/40 p-2 rounded border border-[#26282D]">
                          Mantap! Redis Pub/Sub sync antar container juga sudah teruji stabil di P99 14ms 🚀
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#26282D] flex items-center gap-2 bg-[#2B2D31] rounded-lg p-2.5">
                    <input
                      type="text"
                      readOnly
                      value="Kirim pesan ke #general..."
                      className="bg-transparent text-xs text-[#949BA4] flex-1 outline-none cursor-default"
                    />
                    <Link
                      href="/app"
                      className="px-3 py-1 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs rounded font-medium flex items-center gap-1"
                    >
                      <span>Coba Interaktif</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ENGINEERING FEATURES */}
      <section id="features" className="py-20 bg-[#111214] border-b border-[#26282D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/25">
              FITUR TEKNIS
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#F2F3F5] mt-4">
              Dibangun dengan Standar Kinerja Backend Tertinggi
            </h2>
            <p className="text-sm sm:text-base text-[#949BA4] mt-3">
              Setiap komponen dirancang tanpa kompromi untuk stabilitas koneksi, persistensi data, dan integritas multi-user.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#17181B] border border-[#26282D] hover:border-[#5865F2]/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#5865F2]/15 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2] mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-[#F2F3F5]">WebSocket Engine Berbasis Go</h3>
              <p className="text-xs text-[#949BA4] mt-2 leading-relaxed">
                Menggunakan library coder/websocket dengan zero-allocation reader loops, sanggup melayani puluhan ribu concurrent sockets dengan CPU overhead minimal.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#17181B] border border-[#26282D] hover:border-[#5865F2]/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#23A55A]/15 border border-[#23A55A]/30 flex items-center justify-center text-[#23A55A] mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-[#F2F3F5]">Distributed Redis Pub/Sub</h3>
              <p className="text-xs text-[#949BA4] mt-2 leading-relaxed">
                Event messaging terdistribusi otomatis disinkronkan antar multi-instance backend, didukung Redis TTL presence heartbeat.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#17181B] border border-[#26282D] hover:border-[#5865F2]/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#F0B232]/15 border border-[#F0B232]/30 flex items-center justify-center text-[#F0B232] mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-[#F2F3F5]">Database ACID & Cursor Pagination</h3>
              <p className="text-xs text-[#949BA4] mt-2 leading-relaxed">
                PostgreSQL 16 dengan 18 entitas relasional terindeks, UUID primary keys, dan cursor-based pagination untuk query riwayat chat secepat kilat.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#17181B] border border-[#26282D] hover:border-[#5865F2]/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#5865F2]/15 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2] mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-[#F2F3F5]">Role-Based Access Control (RBAC)</h3>
              <p className="text-xs text-[#949BA4] mt-2 leading-relaxed">
                Sistem perizinan granular di tingkat server dan channel dengan enkripsi password menggunakan algoritma bcrypt hashing.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#17181B] border border-[#26282D] hover:border-[#5865F2]/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#F23F43]/15 border border-[#F23F43]/30 flex items-center justify-center text-[#F23F43] mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-[#F2F3F5]">Next.js 16 + Zustand Optimistic UI</h3>
              <p className="text-xs text-[#949BA4] mt-2 leading-relaxed">
                Pengalaman pengguna real-time tanpa refresh halaman berkat manajemen state Zustand dan pengiriman pesan berkonsep optimistic update.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#17181B] border border-[#26282D] hover:border-[#5865F2]/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#23A55A]/15 border border-[#23A55A]/30 flex items-center justify-center text-[#23A55A] mb-4">
                <Code className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-[#F2F3F5]">One-Command Docker Deployment</h3>
              <p className="text-xs text-[#949BA4] mt-2 leading-relaxed">
                Konfigurasi `docker-compose.yml` siap produksi dengan auto-migration saat kontainer pertama kali dinyalakan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE SECTION */}
      <section id="architecture" className="py-20 bg-[#17181B] border-b border-[#26282D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/25">
              SYSTEM DESIGN
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#F2F3F5] mt-4">
              Arsitektur Modular Monolith yang Siap Skala
            </h2>
          </div>

          <div className="bg-[#111214] border border-[#26282D] rounded-2xl p-6 sm:p-8 font-mono text-xs overflow-x-auto shadow-2xl">
            <pre className="text-[#949BA4] leading-relaxed">
{`+---------------------------------------------------------------------------------+
|                                 CLIENT CLIENTS                                  |
|         Next.js App Router  /  TypeScript  /  Tailwind CSS  /  Zustand          |
+---------------------------------------+-----------------------------------------+
                                        |  REST API (/api/v1) & WebSocket (/ws)
                                        v
+---------------------------------------------------------------------------------+
|                              GOCHAT BACKEND (Go 1.25+)                          |
|  [ Gin HTTP Engine ] <---> [ WebSocket Hub ] <---> [ Auth / JWT & RBAC Guard ]   |
|         |                          |                           |                |
|         v                          v                           v                |
|  [ Repository Layer ] <---> [ Service Layer ] <-----> [ Event Broadcaster ]     |
+---------+--------------------------+---------------------------+----------------+
          |                          |                           |
          v                          |                           v
+-----------------------+            |            +-------------------------------+
|     PostgreSQL 16     |            +----------->|            Redis 7            |
| 18 Relational Tables  |                         |  Pub/Sub Cross-Nodes Broadcast|
| UUID Keys / Migrator  |                         |  User Presence TTL Heartbeat  |
+-----------------------+                         +-------------------------------+`}
            </pre>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 bg-[#111214] border-b border-[#26282D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/25">
              PAKET &amp; HARGA
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#F2F3F5] mt-4">
              Transparan, Terbuka, dan Bebas Kunci Vendor
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div className="p-6 rounded-2xl bg-[#17181B] border border-[#26282D] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-[#F2F3F5]">Community</h3>
                <p className="text-xs text-[#949BA4] mt-1">Untuk komunitas terbuka &amp; proyek open-source.</p>
                <div className="my-5">
                  <span className="text-3xl font-bold text-[#F2F3F5]">Rp 0</span>
                  <span className="text-xs text-[#949BA4]"> / selamanya</span>
                </div>
                <ul className="space-y-2.5 text-xs text-[#949BA4]">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#23A55A]" /> Unlimited server &amp; channel</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#23A55A]" /> Riwayat pesan 30 hari</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#23A55A]" /> Direct messages &amp; reactions</li>
                </ul>
              </div>
              <Link
                href="/register"
                className="mt-6 w-full py-2.5 rounded-lg bg-[#2B2D31] hover:bg-[#32353B] text-xs font-semibold text-[#F2F3F5] text-center transition"
              >
                Mulai Gratis
              </Link>
            </div>

            {/* Pro */}
            <div className="p-6 rounded-2xl bg-[#17181B] border-2 border-[#5865F2] relative flex flex-col justify-between shadow-xl shadow-[#5865F2]/10">
              <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#5865F2] text-white">
                PALING POPULER
              </span>
              <div>
                <h3 className="font-bold text-base text-[#F2F3F5]">Team Pro</h3>
                <p className="text-xs text-[#949BA4] mt-1">Untuk tim engineering &amp; startup aktif.</p>
                <div className="my-5">
                  <span className="text-3xl font-bold text-[#F2F3F5]">Rp 49.000</span>
                  <span className="text-xs text-[#949BA4]"> / pengguna / bln</span>
                </div>
                <ul className="space-y-2.5 text-xs text-[#F2F3F5]">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#23A55A]" /> Riwayat pesan tak terbatas</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#23A55A]" /> Lampiran file hingga 100MB</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#23A55A]" /> Custom role &amp; advanced RBAC</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#23A55A]" /> Prioritas WebSocket traffic</li>
                </ul>
              </div>
              <Link
                href="/register"
                className="mt-6 w-full py-2.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-xs font-semibold text-white text-center transition shadow-md"
              >
                Coba 14 Hari Gratis
              </Link>
            </div>

            {/* Self-Hosted */}
            <div className="p-6 rounded-2xl bg-[#17181B] border border-[#26282D] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-[#F2F3F5]">Self-Hosted</h3>
                <p className="text-xs text-[#949BA4] mt-1">Kontrol penuh pada VPS atau server on-premise.</p>
                <div className="my-5">
                  <span className="text-3xl font-bold text-[#F2F3F5]">Open Source</span>
                </div>
                <ul className="space-y-2.5 text-xs text-[#949BA4]">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#23A55A]" /> Kode sumber 100% terbuka</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#23A55A]" /> Docker Compose production-ready</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#23A55A]" /> Tanpa batasan seat pengguna</li>
                </ul>
              </div>
              <a
                href="https://github.com/gochat/gochat"
                target="_blank"
                rel="noreferrer"
                className="mt-6 w-full py-2.5 rounded-lg bg-[#2B2D31] hover:bg-[#32353B] text-xs font-semibold text-[#F2F3F5] text-center transition"
              >
                Lihat di GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 bg-[#111214] border-b border-[#26282D]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/25">
              FAQ
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F2F3F5] mt-3">
              Pertanyaan yang Sering Diajukan
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Apa perbedaan GoChat dengan Discord atau Slack?',
                a: 'GoChat dirancang khusus dengan backend Go berkinerja tinggi, kode sumber terbuka, latensi ultra-rendah, serta dapat di-deploy mandiri (self-hosted) via Docker tanpa biaya lisensi tersembunyi.',
              },
              {
                q: 'Bagaimana cara menjalankan GoChat di server lokal?',
                a: 'Cukup clone repositori ini, pastikan Docker berjalan, lalu ketik `docker compose up -d`. Sistem akan otomatis menginisialisasi PostgreSQL 16, Redis 7, Backend Go, dan Frontend Next.js.',
              },
              {
                q: 'Apakah GoChat mendukung Direct Message dan Channel privat?',
                a: 'Ya, GoChat mendukung pesan pribadi 1-on-1, percakapan grup privat, serta channel server berbasis hak akses (RBAC).',
              },
              {
                q: 'Teknologi apa yang digunakan untuk komunikasi real-time?',
                a: 'Kami menggunakan WebSocket standar RFC 6455 dengan implementasi Go coder/websocket dan fallback sync yang andal serta tahan gangguan jaringan.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl bg-[#17181B] border border-[#26282D] overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-sm font-semibold text-[#F2F3F5] hover:text-[#5865F2] transition"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#949BA4] transition-transform ${
                      faqOpen === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-4 text-xs text-[#949BA4] leading-relaxed border-t border-[#26282D]/60 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#111214] py-12 px-4 sm:px-6 lg:px-8 text-xs text-[#949BA4]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#5865F2] flex items-center justify-center text-white">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-[#F2F3F5]">GoChat</span>
            <span>— Real-Time Engineering &amp; Community Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-[#F2F3F5] transition">Masuk</Link>
            <Link href="/register" className="hover:text-[#F2F3F5] transition">Daftar</Link>
            <Link href="/reset-password" className="hover:text-[#F2F3F5] transition">Lupa Password</Link>
            <Link href="/app" className="text-[#5865F2] hover:underline font-medium">Buka Web App</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
