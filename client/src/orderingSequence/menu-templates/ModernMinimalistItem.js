// import React, { useState } from 'react';
// import ItemDetailModal from '../menu-templates/modals/ItemDetailModal';

// const ModernMinimalistItem = ({ item, formatCurrency, isAvailable = true, soldOutAtLocation = false, currentQuantity = 0, onIncrement, onDecrement, onItemClick, isLastInCategory }) => {
//   console.log('ModernMinimalistItem received item:', JSON.parse(JSON.stringify(item)));
//   console.log('ITEM IMAGE', item.image);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [imageError, setImageError] = useState(false);
//   const [imageLoading, setImageLoading] = useState(true);
  
//   const handleImageError = (e) => {
//     console.error('Image failed to load:', {
//       src: e.target.src,
//       error: 'Image load error',
//       itemId: item.id,
//       itemName: item.name
//     });
//     setImageError(true);
//     setImageLoading(false);
//   };
  
//   const handleImageLoad = () => {
//     console.log('Image loaded successfully:', {
//       src: item.image,
//       itemId: item.id,
//       itemName: item.name
//     });
//     setImageLoading(false);
//     setImageError(false);
//   };

//   const handleItemClick = (e) => {
//     e.stopPropagation();
//     setIsModalOpen(true);
//     onItemClick?.(item);
//   };

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//   };
//   const itemData = item.item_data || {};
//   const variation = itemData?.variations?.[0];
//   const price = variation?.item_variation_data?.price_money || { amount: item.price * 100, currency: 'USD' };

//   const formatPrice = (amount, currency = 'USD') => {
//     if (!amount) return '$0.00';
//     const value = typeof amount === 'number' ? amount / 100 : 0;
//     return `$${value.toFixed(2)}`;
//   };

//   return (
//     <div 
//       className="menu-item-card" 
//       onClick={handleItemClick}
//       style={{
//         background: 'white',
//         border: 'none',
//         transition: 'background-color 0.2s ease',
//         display: 'flex',
//         alignItems: 'flex-start',
//         padding: '10px 0px',
//         position: 'relative',
//         gap: '16px',
//         fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
//         cursor: 'pointer',
//         borderBottom: 'none'
        
//       }}
//     >
//       <div style={{
//         flex: 1,
//         display: 'flex',
//         flexDirection: 'column',
//         textAlign: 'left',
//         alignItems: 'flex-start'
//       }}>
//         <div style={{
//           display: 'flex',
//           flexDirection: 'column',
//           gap: '8px',
//           width: '100%'
//         }}>
//           <h3 style={{
//             fontSize: '15px',
//             fontWeight: 600,
//             color: '#000',
//             margin: 0,
//             lineHeight: 1.2,
//             fontFamily: 'Satoshi, sans-serif'
//           }}>
//             {item.name || 'Unnamed Item'}
//           </h3>

//           {item.description && (
//             <p style={{
//               color: 'rgb(112, 112, 112)',
//               fontSize: '14px',
//               lineHeight: 1.4,
//               margin: 0,
//               display: '-webkit-box',
//               WebkitLineClamp: 2,
//               WebkitBoxOrient: 'vertical',
//               overflow: 'hidden',
//               fontFamily: 'Satoshi, sans-serif',
//               fontWeight: 400
//             }}>
//               {item.description}
//             </p>
//           )}

//           <div style={{
//             fontSize: '14px',
//             fontWeight: 400,
//             color: 'rgb(112, 112, 112)',
//             marginTop: '4px',
//             fontFamily: 'Satoshi, sans-serif'
//           }}>
//             {formatPrice(price.amount, price.currency)}
//           </div>
//         </div>
//       </div>

//       <div style={{
//         width: '120px',
//         height: '120px',
//         borderRadius: '12px',
//         overflow: 'hidden',
//         background: '#f7fafc',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         position: 'relative',
//         flexShrink: 0
//       }}>
//         {item.image ? (
//           <>
//             <img 
//               src={item.image} 
//               alt={item.name || 'Menu item'}
//               style={{
//                 width: '100%',
//                 height: '100%',
//                 objectFit: 'cover',
//                 opacity: imageLoading ? 0 : 1,
//                 transition: 'opacity 0.3s ease-in-out'
//               }}
//               onError={handleImageError}
//               onLoad={handleImageLoad}
//               loading="lazy"
//             />
//           </>
//         ) : (
//           <div style={{
//             width: '100%',
//             height: '100%',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             background: '#f7fafc',
//             color: '#a0aec0',
//             fontSize: '12px',
//             fontFamily: 'Satoshi, sans-serif',
//             fontWeight: 400
//           }}>
//             {imageError ? 'Image not available' : 'No Image'}
//           </div>
//         )}
//       </div>
      
//       <ItemDetailModal
//         isOpen={isModalOpen}
//         onClose={handleCloseModal}
//         item={item}
//         isItemInStock={() => isAvailable}
//       />
//     </div>
//   );
// };

// export default ModernMinimalistItem;

import React, { useState } from 'react';
import ItemDetailModal from '../menu-templates/modals/ItemDetailModal';

const ModernMinimalistItem = ({
  item,
  formatCurrency,
  isAvailable = true,
  soldOutAtLocation = false,
  currentQuantity = 0,
  onIncrement,
  onDecrement,
  onItemClick,
  isLastInCategory
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageStatus, setImageStatus] = useState('loading'); // 'loading', 'loaded', 'error'

  const handleImageLoad = () => {
    console.log('✅ Image loaded successfully:', item.image);
    setImageStatus('loaded');
  };

  const handleImageError = (e) => {
    console.error('❌ Image failed to load:', item.image, e);
    setImageStatus('error');
  };

  const handleItemClick = (e) => {
    e.stopPropagation();
    setIsModalOpen(true);
    onItemClick?.(item);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const itemData = item.item_data || {};
  const variation = itemData?.variations?.[0];
  const price = variation?.item_variation_data?.price_money || {
    amount: item.price * 100,
    currency: 'USD'
  };

  const formatPrice = (amount, currency = 'USD') => {
    if (!amount) return '$0.00';
    const value = typeof amount === 'number' ? amount / 100 : 0;
    return `$${value.toFixed(2)}`;
  };

  // Debug logging
  console.log('ModernMinimalistItem render:', {
    itemName: item.name,
    imageUrl: item.image,
    imageStatus,
    hasImage: !!item.image
  });

  return (
    <div
      className="menu-item-card"
      onClick={handleItemClick}
      style={{
        background: 'white',
        border: 'none',
        transition: 'background-color 0.2s ease',
        display: 'flex',
        alignItems: 'flex-start',
        padding: '10px 0px',
        position: 'relative',
        gap: '16px',
        fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        cursor: 'pointer',
        borderBottom: isLastInCategory ? 'none' : '1px solid #eee'
      }}
    >
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        alignItems: 'flex-start'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          width: '100%'
        }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#000',
            margin: 0,
            lineHeight: 1.2,
            fontFamily: 'Satoshi, sans-serif'
          }}>
            {item.name || 'Unnamed Item'}
          </h3>

          {item.description && (
            <p style={{
              color: 'rgb(112, 112, 112)',
              fontSize: '14px',
              lineHeight: 1.4,
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontFamily: 'Satoshi, sans-serif',
              fontWeight: 400
            }}>
              {item.description}
            </p>
          )}

          <div style={{
            fontSize: '14px',
            fontWeight: 400,
            color: 'rgb(112, 112, 112)',
            marginTop: '4px',
            fontFamily: 'Satoshi, sans-serif'
          }}>
            {formatPrice(price.amount, price.currency)}
          </div>
        </div>
      </div>

      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#f7fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0
      }}>
        {item.image ? (
          <>
            {/* Always render the image, but control visibility */}
            <img
              src={item.image}
              alt={item.name || 'Menu item'}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: imageStatus === 'loaded' ? 'block' : 'none'
              }}
              loading="lazy"
            />
            
            {/* Show loading or error state */}
            {imageStatus === 'loading' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f7fafc',
                color: '#a0aec0',
                fontSize: '12px',
                fontFamily: 'Satoshi, sans-serif'
              }}>
                Loading...
              </div>
            )}
            
            {imageStatus === 'error' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f7fafc',
                color: '#a0aec0',
                fontSize: '12px',
                fontFamily: 'Satoshi, sans-serif',
                textAlign: 'center'
              }}>
                Image not available
              </div>
            )}
          </>
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f7fafc',
            color: '#a0aec0',
            fontSize: '12px',
            fontFamily: 'Satoshi, sans-serif'
          }}>
            No image
          </div>
        )}
      </div>

      <ItemDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        item={item}
        isItemInStock={() => isAvailable}
      />
    </div>
  );
};

export default ModernMinimalistItem;