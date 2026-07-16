import dynamic from 'next/dynamic'

// Use dynamic import with ssr: false to force client-side rendering
const MyBanksClient = dynamic(
  () => import('./MyBanksClient'),
  { ssr: false }
)

export default function MyBanks() {
  return <MyBanksClient />
}