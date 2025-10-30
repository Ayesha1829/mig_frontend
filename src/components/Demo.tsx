import React, { useEffect, useCallback, useRef } from 'react';

/*
 * Tutorial Demo Component
 * 
 * This component provides animated demonstrations for the Migoyugo game tutorial.
 * It includes demos for:
 * - Board gameplay (8x8 grid with move sequences)
 * - Yugo formation (4-in-a-row detection)
 * - Yugo creation (Yugo formation from Migos)
 * - Long line prevention (invalid move demonstration)
 * - Igo formation (special game mechanics)
 * 
 * Usage in App.tsx:
 * import TutorialDemo from './components/Demo';
 * <TutorialDemo demoType="board" />
 * 
 * Available demo types: 'board', 'yugo', 'yugo-formation', 'long-line', 'igo'
 */

// Component props interface
interface TutorialDemoProps {
  demoType: 'board' | 'yugo' | 'yugo-formation' | 'long-line' | 'igo';
}

// Tutorial animation helper functions
const createTutorialDot = (color: string): HTMLElement => {
  const dot = document.createElement('div');
  dot.className = `tutorial-demo-dot ${color}`;
  dot.style.cssText = `
    width: 24px;
    height: 24px;
    border-radius: 50%;
    transition: all 0.3s ease;
    ${color === 'white' 
      ? 'background: #ecf0f1; border: 2px solid #2c3e50; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);'
      : 'background: #2c3e50; border: 2px solid #1a252f; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);'
    }
  `;
  return dot;
};

const addTutorialStyles = () => {
    if (!document.querySelector('#tutorial-animations')) {
      const style = document.createElement('style');
      style.id = 'tutorial-animations';
      style.textContent = `
        @keyframes migoAppear {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.7; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        .migo-appear { animation: migoAppear 0.5s ease-out forwards; }
        @keyframes migoFade {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        }
        .migo-fade { animation: migoFade 0.5s ease-out forwards !important; }
        @keyframes pulse {
          0% { transform: translateX(-50%) scale(1); opacity: 1; }
          50% { transform: translateX(-50%) scale(1.2); opacity: 0.7; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        .pulsing-arrow { animation: pulse 1s infinite; }
        @keyframes igo-pulse {
          0% { 
            box-shadow: inset 0 0 10px 2px rgba(212, 175, 55, 0.4);
            background-color: rgba(212, 175, 55, 0.2);
          }
          50% { 
            box-shadow: inset 0 0 20px 5px rgba(212, 175, 55, 0.7);
            background-color: rgba(212, 175, 55, 0.4);
          }
          100% { 
            box-shadow: inset 0 0 10px 2px rgba(212, 175, 55, 0.4);
            background-color: rgba(212, 175, 55, 0.2);
          }
        }
        @keyframes yugoAppear {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
        .yugo-appear {
          animation: yugoAppear 0.5s ease-out forwards;
        }
        .yugo-fade {
          animation: yugoFade 0.5s ease-out forwards !important;
        }
        @keyframes yugoFade {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
          }
        }
        .tutorial-demo-migo {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          transition: transform 0.3s ease;
        }
        .tutorial-demo-migo.yugo::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background-color: #e74c3c;
          border-radius: 50%;
          z-index: 2;
        }
      `;
      document.head.appendChild(style);
    }
  };
  
  const setupBoardDemo = (container: HTMLElement, animationRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    addTutorialStyles();
    const board = document.createElement('div');
    board.className = 'tutorial-demo-board';
    board.style.cssText = `
      display: grid;
      grid-template-columns: repeat(8, 30px);
      grid-template-rows: repeat(8, 30px);
      gap: 1px;
      background: #bdc3c7;
      padding: 5px;
      border-radius: 5px;
      border: 2px solid #2c3e50;
    `;
  
    for (let i = 0; i < 64; i++) {
      const cell = document.createElement('div');
      cell.className = 'tutorial-demo-cell';
      cell.style.cssText = `
        background: #d1e6f9;
        border-radius: 2px;
        position: relative;
        transition: background-color 0.2s;
      `;
      board.appendChild(cell);
    }
  
    container.appendChild(board);
  
    // Define the sequence of 8 moves
    const moves = [
      { color: 'white', pos: 'D5', cell: 8 * (8 - 5) + (3) },  // WD5
      { color: 'black', pos: 'F3', cell: 8 * (8 - 3) + (5) },  // BF3
      { color: 'white', pos: 'D4', cell: 8 * (8 - 4) + (3) },  // WD4
      { color: 'black', pos: 'F4', cell: 8 * (8 - 4) + (5) },  // BF4
      { color: 'white', pos: 'F5', cell: 8 * (8 - 5) + (5) },  // WF5
      { color: 'black', pos: 'E5', cell: 8 * (8 - 5) + (4) },  // BE5
      { color: 'white', pos: 'C4', cell: 8 * (8 - 4) + (2) },  // WC4
      { color: 'black', pos: 'D6', cell: 8 * (8 - 6) + (3) }   // BD6
    ];
  
    let currentMove = 0;
    
    const createAnimatedIon = (color: string) => {
      const migo = createTutorialDot(color);
      migo.classList.add('migo-appear');
      return migo;
    };
    
    const placeMove = () => {
      if (currentMove < moves.length) {
        const move = moves[currentMove];
        const migo = createAnimatedIon(move.color);
        board.children[move.cell].appendChild(migo);
        currentMove++;
        animationRef.current = setTimeout(placeMove, 1000);
      } else {
        // Wait 2 seconds before fading
        animationRef.current = setTimeout(() => {
          Array.from(board.children).forEach(cell => {
            const migo = cell.querySelector('.tutorial-demo-migo');
            if (migo) migo.classList.add('migo-fade');
          });
          
          animationRef.current = setTimeout(() => {
            clearTutorialBoard(board);
            currentMove = 0;
            placeMove();
          }, 500);
        }, 2000);
      }
    };
  
    animationRef.current = setTimeout(placeMove, 1000);
  };
  
  const setupYugoDemo = (container: HTMLElement, animationRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    addTutorialStyles();
    const board = createSmallBoard();
    container.appendChild(board);
    
    let step = 0;
    const whiteRow = [6, 7, 8, 9];    // Second row cells
    const blackRow = [12, 13, 14, 15]; // Third row cells
    
    const createPulsingArrow = () => {
      const arrow = document.createElement('div');
      arrow.className = 'pulsing-arrow';  
      arrow.style.cssText = `
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 15px solid #2ecc71;
        animation: pulse 1s infinite;
      `;
      return arrow;
    };
  
    const createAnimatedIon = (color: string) => {
      const migo = createTutorialDot(color);
      migo.classList.add('migo-appear');
      return migo;
    };
  
    const resetDemo = () => {
      step = 0;
      startSequence();
    };
  
    const startSequence = () => {
      const sequence = () => {
        if (step < 6) { // Place first three pairs of dots
          const isWhite = step % 2 === 0;
          const cellIndex = Math.floor(step / 2);
          const migo = createAnimatedIon(isWhite ? 'white' : 'black');
          board.children[isWhite ? whiteRow[cellIndex] : blackRow[cellIndex]].appendChild(migo);
          step++;
          animationRef.current = setTimeout(sequence, 1000);
        } else if (step === 6) { // Add pulsing arrow only for white's fourth position
          const whiteArrow = createPulsingArrow();
          board.children[whiteRow[3]].appendChild(whiteArrow);
          step++;
          animationRef.current = setTimeout(sequence, 2000);
        } else if (step === 7) { // Place final white migo and highlight
          // Remove arrow
          const fourthCell = board.children[whiteRow[3]] as HTMLElement;
          const arrow = fourthCell.querySelector('.pulsing-arrow');
          if (arrow) fourthCell.removeChild(arrow);
          
          // Place final white migo
          const whiteMigo = createAnimatedIon('white');
          fourthCell.appendChild(whiteMigo);
          
          // Highlight only the white yugo
          whiteRow.forEach(cellIndex => {
            const cell = board.children[cellIndex] as HTMLElement;
            cell.style.backgroundColor = 'rgba(46, 204, 113, 0.3)';
            cell.style.boxShadow = 'inset 0 0 10px rgba(46, 204, 113, 0.5)';
            cell.style.transition = 'all 0.5s ease';
          });
          
          step++;
          // Wait 3 seconds before fading
          animationRef.current = setTimeout(() => {
            // Fade out both dots and highlighting together
            Array.from(board.children).forEach(cell => {
              const migo = (cell as HTMLElement).querySelector('.tutorial-demo-migo');
              if (migo) migo.classList.add('migo-fade');
              (cell as HTMLElement).style.backgroundColor = '#d1e6f9';
              (cell as HTMLElement).style.boxShadow = 'none';
            });
            
            // Wait for fade animation to complete before cleanup
            animationRef.current = setTimeout(() => {
              clearTutorialBoard(board);
              resetDemo();
            }, 500);
          }, 3000);
        }
      };
      
      // Start with 1 second delay
      animationRef.current = setTimeout(sequence, 1000);
    };
  
    // Start the animation sequence with 1 second delay
    animationRef.current = setTimeout(startSequence, 1000);
  };
  
  const setupYugoFormationDemo = (container: HTMLElement, animationRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    addTutorialStyles();
    const board = createSmallBoard();
    container.appendChild(board);
    
    let step = 0;
    const moves = [
      { color: 'white', pos: [1, 1] },
      { color: 'black', pos: [2, 1] },
      { color: 'white', pos: [1, 2] },
      { color: 'black', pos: [2, 2] },
      { color: 'white', pos: [1, 3] },
      { color: 'black', pos: [2, 3] },
      { color: 'white', pos: [1, 4] }  // Final move that creates the yugo
    ];
    
    const createPulsingArrow = () => {
      const arrow = document.createElement('div');
      arrow.className = 'pulsing-arrow';
      arrow.style.cssText = `
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 15px solid #2ecc71;
        animation: pulse 1s infinite;
      `;
      return arrow;
    };
  
    const createAnimatedIon = (color: string, isYugo = false) => {
      const migo = createTutorialDot(color);
      if (isYugo) {
        migo.classList.add('yugo');
      }
      migo.classList.add('migo-appear');
      return migo;
    };
    
    const placeNextMove = () => {
      if (step < moves.length) {
        const move = moves[step];
        const [row, col] = move.pos;
        const index = row * 6 + col;
        const cell = board.children[index] as HTMLElement;
        
        if (cell) {
          if (step === moves.length - 1) {
            // Show arrow for final move
            const arrow = createPulsingArrow();
            cell.appendChild(arrow);
            animationRef.current = setTimeout(() => {
              cell.removeChild(arrow);
              const yugoIon = createAnimatedIon('white', true);
              cell.appendChild(yugoIon);
              
              // Highlight the yugo line
              for (let i = 1; i <= 4; i++) {
                const yugoCell = board.children[1 * 6 + i] as HTMLElement;
                yugoCell.style.backgroundColor = 'rgba(46, 204, 113, 0.3)';
                yugoCell.style.boxShadow = 'inset 0 0 10px rgba(46, 204, 113, 0.5)';
                yugoCell.style.transition = 'all 0.3s ease';
              }
              
              // Wait 0.5 seconds after Yugo appears, then fade out the 3 Migos
              animationRef.current = setTimeout(() => {
                // Get the 3 white Migos (not the Yugo) - correct class name
                const migoElements: HTMLElement[] = [];
                for (let i = 1; i <= 3; i++) {
                  const migoCell = board.children[1 * 6 + i] as HTMLElement;
                  const migoIon = migoCell.querySelector('.tutorial-demo-dot:not(.yugo)');
                  if (migoIon) {
                    migoElements.push(migoIon as HTMLElement);
                  }
                }
                
                console.log('Found Migos to fade:', migoElements.length); // Debug log
                
                // Apply fade-out to each Migo using CSS class (to override !important)
                migoElements.forEach((migo) => {
                  migo.classList.remove('migo-appear'); // Remove appear animation
                  migo.classList.add('migo-fade'); // Add fade animation
                  
                  // Remove the element after fade completes
                  setTimeout(() => {
                    if (migo.parentNode) {
                      migo.parentNode.removeChild(migo);
                    }
                  }, 500);
                });
              }, 500);
              
              // Wait 3 seconds total, then fade everything
              animationRef.current = setTimeout(() => {
                // Fade out all remaining dots (black dots and yugo)
                Array.from(board.children).forEach(cell => {
                  const migo = (cell as HTMLElement).querySelector('.tutorial-demo-migo');
                  if (migo) {
                    migo.classList.add('migo-fade');
                  }
                  (cell as HTMLElement).style.backgroundColor = '#d1e6f9';
                  (cell as HTMLElement).style.boxShadow = 'none';
                });
                
                // Wait for fade animation to complete before cleanup and restart
                animationRef.current = setTimeout(() => {
                  clearTutorialBoard(board);
                  step = 0;
                  animationRef.current = setTimeout(placeNextMove, 1000); // 1 second delay before restart
                }, 500);
              }, 3000);
            }, 1000);
          } else {
            const migo = createAnimatedIon(move.color);
            cell.appendChild(migo);
            step++;
            animationRef.current = setTimeout(placeNextMove, 1000);
          }
        }
      }
    };
    
    // Start with 1 second delay
    animationRef.current = setTimeout(placeNextMove, 1000);
  };
  
  const setupLongLineDemo = (container: HTMLElement, animationRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    addTutorialStyles();
    const board = createSmallBoard();
    container.appendChild(board);
    
    let step = 0;
    const moves = [
      { pos: [1, 0] },  // Column 6
      { pos: [1, 1] },  // Column 7
      { pos: [1, 3] },  // Column 9
      { pos: [1, 4] }   // Column 10
    ];
    
    const createPulsingArrow = () => {
      const arrow = document.createElement('div');
      arrow.className = 'pulsing-arrow';
      arrow.style.cssText = `
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 15px solid #2ecc71;
        animation: pulse 1s infinite;
        transition: opacity 0.3s ease;
      `;
      return arrow;
    };
  
    const createAnimatedIon = (color: string) => {
      const migo = createTutorialDot(color);
      migo.classList.add('migo-appear');
      return migo;
    };
    
    const placeNextMove = () => {
      if (step < moves.length) {
        const move = moves[step];
        const [row, col] = move.pos;
        const index = row * 6 + col;
        const cell = board.children[index] as HTMLElement;
        
        if (cell) {
          const migo = createAnimatedIon('white');
          cell.appendChild(migo);
          
          if (step === moves.length - 1) {
            // Wait 1 second after last migo before showing arrow
            animationRef.current = setTimeout(() => {
              const invalidCell = board.children[1 * 6 + 2] as HTMLElement; // Column 8
              const arrow = createPulsingArrow();
              invalidCell.appendChild(arrow);
              
              // After 1 second, show red X
              animationRef.current = setTimeout(() => {
                invalidCell.style.backgroundColor = 'rgba(231, 76, 60, 0.3)';
                invalidCell.style.boxShadow = 'inset 0 0 10px rgba(231, 76, 60, 0.5)';
                invalidCell.style.transition = 'all 0.3s ease';
                
                const x = document.createElement('div');
                x.textContent = '✕';
                x.style.cssText = `
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  color: #e74c3c;
                  font-size: 24px;
                  font-weight: bold;
                  z-index: 2;
                  transition: opacity 0.3s ease;
                `;
                invalidCell.appendChild(x);
                
                // After 3 seconds, fade everything together
                animationRef.current = setTimeout(() => {
                  // Start fade animations
                  arrow.style.opacity = '0';
                  x.style.opacity = '0';
                  invalidCell.style.backgroundColor = '#d1e6f9';
                  invalidCell.style.boxShadow = 'none';
                  
                  // Fade dots
                  Array.from(board.children).forEach(cell => {
                    const migo = (cell as HTMLElement).querySelector('.tutorial-demo-migo');
                    if (migo) {
                      migo.classList.add('migo-fade');
                    }
                  });
                  
                  // Reset after fade animation completes
                  animationRef.current = setTimeout(() => {
                    clearTutorialBoard(board);
                    step = 0;
                    animationRef.current = setTimeout(placeNextMove, 1000); // 1 second delay before restart
                  }, 500);
                }, 3000);
              }, 1000);
            }, 1000);
          } else {
            step++;
            animationRef.current = setTimeout(placeNextMove, 1000);
          }
        }
      }
    };
    
    // Start with 1 second delay
    animationRef.current = setTimeout(placeNextMove, 1000);
  };
  
  const setupIgoDemo = (container: HTMLElement, animationRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    addTutorialStyles();
    const board = createSmallBoard();
    container.appendChild(board);
    
    const initialYugos = [
      { pos: [1, 1] },  // Column 7
      { pos: [1, 2] },  // Column 8
      { pos: [1, 4] }   // Column 10
    ];
    //const finalYugo = { pos: [1, 3] };  // Column 9
    
    const createPulsingArrow = () => {
      const arrow = document.createElement('div');
      arrow.className = 'pulsing-arrow';
      arrow.style.cssText = `
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 15px solid #2ecc71;
        animation: pulse 1s infinite;
      `;
      return arrow;
    };
    
    const createYugoWithAnimation = (color: string) => {
      const migo = createTutorialDot(color);
      migo.classList.add('yugo');
      migo.classList.add('yugo-appear');
      return migo;
    };
    
    const startSequence = () => {
      // Place first three yugos together with animation
      initialYugos.forEach(move => {
        const [row, col] = move.pos;
        const index = row * 6 + col;
        const cell = board.children[index] as HTMLElement;
        if (cell) {
          const migo = createYugoWithAnimation('white');
          cell.appendChild(migo);
        }
      });
      
      // After 1 second, show arrow at final position
      animationRef.current = setTimeout(() => {
        const finalCell = board.children[1 * 6 + 3] as HTMLElement; // Column 9
        const arrow = createPulsingArrow();
        finalCell.appendChild(arrow);
        
        // After 2 seconds, remove arrow and place final yugo
        animationRef.current = setTimeout(() => {
          finalCell.removeChild(arrow);
          const migo = createYugoWithAnimation('white');
          finalCell.appendChild(migo);
          
          // Highlight igo
          for (let i = 1; i <= 4; i++) {
            const igoCell = board.children[1 * 6 + i] as HTMLElement;
            igoCell.style.animation = 'igo-pulse 2s infinite ease-in-out';
          }
          
          // After 3 seconds, fade everything
          animationRef.current = setTimeout(() => {
            // Remove igo animation and start fade-out
            Array.from(board.children).forEach(cell => {
              (cell as HTMLElement).style.animation = 'none';
              (cell as HTMLElement).style.transition = 'all 0.5s ease';
              (cell as HTMLElement).style.backgroundColor = '#d1e6f9';
              (cell as HTMLElement).style.boxShadow = 'none';
              
              const migo = (cell as HTMLElement).querySelector('.tutorial-demo-migo');
              if (migo) {
                migo.classList.add('yugo-fade');
              }
            });
            
            // Reset after fade animation completes
            animationRef.current = setTimeout(() => {
              clearTutorialBoard(board);
              animationRef.current = setTimeout(startSequence, 1000); // 1 second delay before restart
            }, 500);
          }, 3000);
        }, 2000);
      }, 1000);
    };
    
    // Start with 1 second delay
    animationRef.current = setTimeout(startSequence, 1000);
  };
  
  // Helper functions for tutorial demos
  const createSmallBoard = (): HTMLElement => {
    const board = document.createElement('div');
    board.className = 'tutorial-demo-board';
    board.style.cssText = `
      display: grid;
      grid-template-columns: repeat(6, 40px);
      grid-template-rows: repeat(4, 40px);
      gap: 1px;
      background: #bdc3c7;
      padding: 5px;
      border-radius: 5px;
      border: 2px solid #2c3e50;
    `;
  
    for (let i = 0; i < 24; i++) {
      const cell = document.createElement('div');
      cell.className = 'tutorial-demo-cell';
      cell.style.cssText = `
        background: #d1e6f9;
        border-radius: 2px;
        position: relative;
        transition: background-color 0.2s;
      `;
      cell.dataset.row = Math.floor(i / 6).toString();
      cell.dataset.col = (i % 6).toString();
      board.appendChild(cell);
    }
    return board;
  };
  
  const clearTutorialBoard = (board: HTMLElement) => {
    if (!board || !board.classList.contains('tutorial-demo-board')) return;
    Array.from(board.children).forEach(cell => {
      if ((cell as HTMLElement).classList.contains('tutorial-demo-cell')) {
        while (cell.firstChild) {
          cell.removeChild(cell.firstChild);
        }
        (cell as HTMLElement).style.backgroundColor = '#d1e6f9';
        (cell as HTMLElement).style.boxShadow = 'none';
        (cell as HTMLElement).style.animation = 'none';
      }
    });
  };
  
  // Tutorial Demo Component
  const TutorialDemo: React.FC<TutorialDemoProps> = ({ demoType }) => {
    const animationRef = useRef<NodeJS.Timeout | null>(null);
    
    const demoRef = useCallback((node: HTMLDivElement | null) => {
      if (node) {
        // Clean up any existing content and animations
        node.innerHTML = '';
        if (animationRef.current) {
          clearInterval(animationRef.current);
          animationRef.current = null;
        }
        
        // Set up the animated demos
        switch (demoType) {
          case 'board':
            setupBoardDemo(node, animationRef);
            break;
          case 'yugo':
            setupYugoDemo(node, animationRef);
            break;
          case 'yugo-formation':
            setupYugoFormationDemo(node, animationRef);
            break;
          case 'long-line':
            setupLongLineDemo(node, animationRef);
            break;
          case 'igo':
            setupIgoDemo(node, animationRef);
            break;
          default:
            node.innerHTML = '<p>Demo coming soon...</p>';
        }
      }
      
      // Cleanup function
      return () => {
        if (animationRef.current) {
          clearInterval(animationRef.current);
          animationRef.current = null;
        }
      };
    }, [demoType]);
  
    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (animationRef.current) {
          clearInterval(animationRef.current);
          animationRef.current = null;
        }
      };
    }, []);
  
    return <div ref={demoRef} style={{ minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} />;
  };

export default TutorialDemo;

// Named exports for individual functions if needed
export { 
  TutorialDemo,
  setupBoardDemo,
  setupYugoDemo,
  setupYugoFormationDemo,
  setupLongLineDemo,
  setupIgoDemo,
  createTutorialDot,
  addTutorialStyles
};

/*
 * Export Summary:
 * 
 * Default export: TutorialDemo component
 * 
 * Import examples:
 * import TutorialDemo from './components/Demo';
 * import { setupBoardDemo, createTutorialDot } from './components/Demo';
 * 
 * The TutorialDemo component accepts a demoType prop with these values:
 * - 'board'
 * - 'yugo'
 * - 'yugo'
 * - 'long-line'
 * - 'igo'
 * 
 * File structure:
 * - React imports and TypeScript interfaces
 * - Helper functions (createTutorialDot, addTutorialStyles)
 * - Demo setup functions (setupBoardDemo, setupYugoDemo, etc.)
 * - Main TutorialDemo component
 * - Exports (default and named)
 * 
 * Migration notes:
 * - Moved from App.tsx as part of code cleanup
 * - All dependencies and functions are now self-contained
 * - Ready for import into App.tsx or other components
 * 
 * File: client/src/components/Demo.tsx
 * Created: Code cleanup and modularization
 */