import React from 'react';
import './AboutPage.css';

interface AboutPageProps {
  onBack: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  return (
    <div className="about-page">
      <div className="about-container">
        <button className="back-button" onClick={onBack}>
          ← Back to Home
        </button>
        
        <div className="about-content">
          <h1 className="about-title"> Migoyugo Q&A</h1>
          
          <div className="about-text">
            <div className="qa-section">
              <h3>1. What is Migoyugo?</h3>
              <p>
                Migoyugo is a two-player abstract strategy game with perfect information – 
                no dice, no cards, no luck involved. It combines the territorial tension of Go 
                with the structural precision of chess.
              </p>

              <h3>2. How long does a typical game take to play?</h3>
              <p>A game will usually take anywhere from 2 to 10 minutes.</p>

              <h3>3. Can I play on my smart tablet or mobile device?</h3>
              <p>
                Migoyugo has been designed to be played on desktop, tablet or 
                smartphones. Despite our best effort, it is possible that the game will not 
                look right on your device. If you encounter this or any other issue, please 
                drop us a line using the 'Feedback' button.
              </p>

              <h3>4. Do I need to register to play online?</h3>
              <p>
                No. You are able to practice in 'Local Play' mode, play against an AI, or even 
                play live (Multiplayer mode) against a human opponent as a Guest. If you 
                want to create a unique username, play in multiplayer against a registered 
                user, or track your stats, you will need to register.
              </p>

              <h3>5. How do I register?</h3>
              <p>
                Register using Google, Facebook, or by creating a unique username and 
                password and confirming by email.
              </p>

              <h3>6. Can two players play on the same device?</h3>
              <p>
                Yes — choose 'Local Play' and both players can take turns on the same 
                screen.
              </p>

              <h3>7. How can I play against another human if I am playing as a Guest (not signed in)?</h3>
              <p>
                If you are playing as a Guest, you can only play against another Guest. 
                Simply select the 'Online Multiplayer' option, press 'Start', and then click on
                'Quick Match'. As soon as another Guest does the same, you will be matched
                and your game will begin.
              </p>

              <h3>8. How can I play against another human if I am signed in with my unique username?</h3>
              <p>
                If you are signed in/logged in, select 'Online Multiplayer' and press 'Start'. If
                you select 'Quick Match', as soon as another logged-in player does the same,
                you will be matched and your game will begin.
              </p>
              <p>
                If you are signed in/logged in, you also have the option to create a private 
                room. Select 'Online Multiplayer' and press 'Start'. Then select 'Private 
                Room' and create your own code (it could be as simple as 123, or anything 
                else you want), and share that code with someone else who is also logged in.
                Then the other logged-in player will also select 'Online Multiplayer' and 
                press 'Start', and select 'Private Room'. Now the player will enter the code 
                you shared and you will be notified. At that point press start and you will be 
                matched and your game will begin.
              </p>

              <h3>9. How does the computer determine which player goes first?</h3>
              <p>
                White always moves first. If you are playing against an AI opponent, you 
                have the option of playing as white or black. If you are playing against a 
                human opponent, the system will randomly select who is white and who is 
                black, and if the players agree to a rematch, the system will automatically 
                change their colors.
              </p>

              <h3>10. Are there standard opening patterns (like in chess or Go)?</h3>
              <p>
                Migoyugo is so new that so far, there are no 'standard' openings - no 
                openings with names. Maybe you'll come up with your own and name it for 
                yourself!
              </p>

              <h3>11. Does the game save my stats?</h3>
              <p>
                For players who sign up and create a unique username, the system is 
                designed to keep track of some stats, like games played, games won and 
                lost, and win percentage. If you are playing as a Guest, the system will not 
                save any stats.
              </p>

              <h3>12. Will you add a ratings system so I can track my improvement?</h3>
              <p>
                Yes, we are working on implementing an Elo ratings system, like the one 
                used in chess and other games and sports.
              </p>

              <h3>13. Will you have stronger AI opponents?</h3>
              <p>
                Right now, we have three AI levels, and none of them are very strong. We 
                are working on creating an AI opponent that is stronger than a human 
                player, but we're not there just yet.
              </p>

              <h3>14. Can I customize the board or colors?</h3>
              <p>
                Absolutely! Click on the 'Settings' button and you can choose from 5 preset 
                options or even customize the colors any way you like. For now, the default 
                scheme is designed for clarity and contrast on both desktop and mobile.
              </p>

              <h3>15. Do you plan on having tournaments?</h3>
              <p>
                Yes, we plan on hosting multiplayer tournaments at some point in the near 
                future. Right now, we're still working out bugs in the basic game, but 
                tournaments are definitely something we'd like to add.
              </p>

              <h3>16. Is there an undo or takeback feature?</h3>
              <p>
                No — once a move is made, it's final. We may add this feature at some point 
                down the road.
              </p>

              <h3>17. Can I spectate live games between other players?</h3>
              <p>
                Not yet, but we plan to add this feature to allow spectators to watch ranked 
                matches, live tournaments, and even replay past games to study strategy.
              </p>

              <h3>18. Is there a way to chat with opponents during a game?</h3>
              <p>Not currently. This is a feature we may add in the future.</p>

              <h3>19. Is Migoyugo available in physical form?</h3>
              <p>
                We're currently testing prototype boards and sets for in-person play. Once 
                this online version is fully stable, we plan to offer physical sets if there is 
                enough interest.
              </p>

              <h3>20. Is there a Discord or forum for discussing strategy?</h3>
              <p>We will offer this feature very soon.</p>

              <h3>21. What happens if I lose my connection or close the app during a game?</h3>
              <p>
              If your connection drops or you close the app before the game finishes, the system treats it as a loss. There’s currently no timeout protection or automatic reconnection. To avoid losing progress, make sure you have a stable internet connection before starting a multiplayer game. We may add timeout protection at some point, but it is not available now.
              </p>
              <h3>22. How do I report a bug or suggest a feature?</h3>
              <p>
                If you find a bug, or have any ideas or suggestions, please let us know at 
                feedback@migoyugo.com.
              </p>

              <h3>23. Can Migoyugo ever be 'solved'?</h3>
              <p>
                In theory, all perfect-information games can be solved, but just like chess or 
                Go, Migoyugo's branching complexity makes that highly unlikely. The 
                possible board states grow faster than even computers can meaningfully 
                analyze. It's simple enough to learn, but far too deep to reduce to formulas.
              </p>

              <h3>24. Where did the name Migoyugo come from?</h3>
              <p>
                The original name for the game was Flux, but as there was already a card 
                game with a very similar name, I realized that this might just lead to 
                confusion. I tried so many different names, but every name I came up with 
                was already taken in some way, and I didn't want to run into copyright 
                problems. Migoyugo just popped into my head one day and I like the sound 
                of it – it is unique, easy to remember, and a perfect reflection of how the 
                gameplay works: me go, you go.
              </p>

              <h3>25. Why does it hurt when I pee?</h3>
              <p>
                This is probably due to a urinary tract infection and if drinking cranberry 
                juice doesn't fix the issue, you should consult a physician.
              </p>

              <h3>26. Will there be an official strategy guide or tutorial series?</h3>
              <p>
                Yes — we're building a library of tutorials and example games to help new 
                players understand tactics, openings, and endgame strategy.
              </p>

              <h3>27. What's the long-term vision for Migoyugo?</h3>
              <p>
                The goal is to grow a lasting community around the game, with live 
                tournaments, ranked ladders, community strategy discussions, and perhaps 
                even physical championships.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
