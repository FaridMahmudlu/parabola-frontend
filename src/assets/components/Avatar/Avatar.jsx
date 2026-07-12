import React from 'react';
import './avatar.css';

const Avatar = ({
  topColor = '#c53d13',     
  bottomColor = '#bd5a5a',  
  skinColor = '#289619',     
  size = 180,               
}) => {
  return (
    <div className="avatar-wrapper" style={{ width: size }}>
    <svg viewBox="0 0 100 240" xmlns="http://www.w3.org/2000/svg">
 
  <circle cx="50" cy="18" r="11" fill={skinColor} />

  <rect rx="5"  ry="5"  x="20" y="36" width="11" height="80" fill={topColor} />
  <rect rx="5"  ry="5"  x="69" y="36" width="11" height="80" fill={topColor} />


  <rect rx="5"  ry="5"  x="31" y="36" width="38" height="50" fill={topColor} />


  <rect  x="33" y="86" width="14" height="158" fill={bottomColor} />
  <rect x="53" y="86" width="14" height="158" fill={bottomColor} />

 
  <line 
    x1="50" 
    y1="74" 
    x2="50" 
    y2="232" 
    stroke="#ce0c0c" 
    strokeWidth="0.5" 
    opacity="0.3" 
  />
</svg>
    </div>
  );
};

export default Avatar;