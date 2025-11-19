// src/pages/HomePage.tsx - 메인 랜딩 페이지
import React from 'react';
import { Header } from '../components/Header';
import { StatusCard } from '../components/StatusCard';
import { ChallengeCard } from '../components/ChallengeCard';
import { CategoryList } from '../components/CategoryList';
import { FooterNav } from '../components/FooterNav';
import './HomePage.css';

export function HomePage() {
  return (
    <div className="home-page">
      <Header />
      <main className="home-main">
        <div className="home-content">
          <StatusCard />
          <ChallengeCard />
          <CategoryList />
        </div>
      </main>
      <FooterNav />
    </div>
  );
}