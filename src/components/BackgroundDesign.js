import React from 'react';
import { Box } from '@mui/material';

const BackgroundDesign = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      {/* Top decorative circles */}
      <svg
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
        }}
      >
        {/* Main circles with University colors */}
        <circle cx="150" cy="100" r="120" fill="rgba(0, 31, 63, 0.08)" />
        <circle cx="1050" cy="150" r="150" fill="rgba(0, 61, 122, 0.08)" />
        
        {/* Curved lines/waves */}
        <path
          d="M 0 150 Q 300 100 600 150 T 1200 150"
          stroke="rgba(0, 31, 63, 0.05)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M 0 300 Q 300 250 600 300 T 1200 300"
          stroke="rgba(0, 61, 122, 0.05)"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Decorative shapes */}
        <rect
          x="50"
          y="400"
          width="100"
          height="100"
          fill="none"
          stroke="rgba(0, 31, 63, 0.05)"
          strokeWidth="2"
          transform="rotate(45 100 450)"
        />
        <rect
          x="1050"
          y="450"
          width="80"
          height="80"
          fill="none"
          stroke="rgba(0, 61, 122, 0.05)"
          strokeWidth="2"
          transform="rotate(45 1090 490)"
        />
      </svg>

      {/* Bottom right accent circle */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '-100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 61, 122, 0.05) 0%, transparent 70%)',
          zIndex: 1,
        }}
      />
    </Box>
  );
};

export default BackgroundDesign;
