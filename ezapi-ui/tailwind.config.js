module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  //purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  //darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      width: {
        22: '5rem',
        30: '7rem',
      },
      borderWidth: {
        1: '1px',
      },
      height: {
        fit: 'fit-content',
      },
      zIndex: {
        999: 999,
      },
      maxWidth: {
        1: '1rem',
        2: '2rem',
        3: '3rem',
        '1/3': '33.33%',
      },
      colors: {
        customGray: '#333333',
        neutral: {
          gray1: '#1C2C40',
          gray2: '#3C4858',
          gray3: '#5A6679',
          gray4: '#8391A7',
          gray5: '#C0CCDA',
          gray6: '#E5E9F2',
          gray7: '#F1F2F6',
          gray8: '#F9FAFC',
        },
        brand: {
          primary: '#C72C71',
          primarySubtle: '#FFEFF1',
          secondary: '#2C71C7',
          secondarySubtle: '#E5F3FF',
          green: '#71C72C',
        },
        accent: {
          red: '#E53535',
          orange: '#FF8800',
          green: '#05A660',
          orangeSubtle: '#FFF8E5',
          greenSubtle: '#E3FFF1',
          redSubtle: '#FFE5E5',
        },
        score: {
          yellow: '#F1C232',
          red: '#A61C00',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  variants: {
    extend: {
      borderWidth: ['focus-within'],
    },
  },
  plugins: [],
};
