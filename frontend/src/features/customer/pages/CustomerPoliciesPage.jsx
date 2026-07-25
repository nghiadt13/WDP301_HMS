import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

import { getHotelPolicies } from '../api/customerApi';
import './CustomerPages.css';

const CustomerPoliciesPage = () => {
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    getHotelPolicies()
      .then(setPolicies)
      .catch(() => setErrorMessage('Không thể tải chính sách khách sạn. Vui lòng thử lại sau.'))
      .finally(() => setIsLoading(false));
  }, []);

  const groupedPolicies = useMemo(() => {
    return policies.reduce((groups, policy) => {
      const category = policy.category || 'Chính sách';
      return {
        ...groups,
        [category]: [...(groups[category] || []), policy],
      };
    }, {});
  }, [policies]);

  return (
    <section className="customer-page customer-policy-page">
      <div className="customer-hero">
        <div>
          <span className="customer-chip">Chính sách khách sạn</span>
          <h1>Chính sách Hotelify</h1>
          <p>Nắm nhanh các quy định về đặt phòng, thanh toán, nhận phòng, trả phòng và lưu trú trước chuyến đi.</p>
        </div>
      </div>

      {errorMessage ? <div className="customer-alert error">{errorMessage}</div> : null}

      {isLoading ? (
        <div className="customer-empty-state">Đang tải chính sách...</div>
      ) : (
        <div className="customer-policy-list">
          {Object.entries(groupedPolicies).map(([category, items]) => (
            <section className="customer-policy-group" key={category}>
              <div className="customer-policy-group-header">
                <div>
                  <span>Nhóm chính sách</span>
                  <h2>{category}</h2>
                </div>
                <span>{items.length} mục</span>
              </div>
              <div className="customer-policy-items">
                {items.map((policy, index) => (
                  <article className="customer-policy-card" key={policy._id}>
                    <div className="customer-policy-card-icon">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <span className="customer-policy-card-number">{String(index + 1).padStart(2, '0')}</span>
                      <h3>{policy.title}</h3>
                      <p>{policy.content}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
          {policies.length === 0 ? <div className="customer-empty-state">Chưa có chính sách nào được công bố.</div> : null}
        </div>
      )}
    </section>
  );
};

export default CustomerPoliciesPage;
