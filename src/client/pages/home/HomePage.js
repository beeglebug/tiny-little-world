import React from 'react'
import Header from '../../components/Header'
import GamePreview from '../../components/GamePreview'

export default function HomePage ({ games = [] }) {
  return (
    <div>
      <Header />
      <div>
        <h2>latest worlds</h2>
        <div>
          {games.map(game => (
            <GamePreview
              key={game._id}
              {...game}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
