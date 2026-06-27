import { Star } from 'lucide-react';

const feedbacks = [
  {
    id: 1,
    rating: 5,
    title: 'Minimalist design filled with natural light',
    content:
      'Everything from the bed linens to the small decorative details was incredibly refined. I spent 3 peaceful nights at the Ocean Grand Suite recharging my energy.',
    name: 'Nguyen Mai Phuong',
    role: 'Interior Designer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: 2,
    rating: 5,
    title: 'The true definition of comfort',
    content:
      'The check-in process was fully automated and incredibly fast. The online support staff via the app were very enthusiastic and attentive throughout my stay.',
    name: 'Le Dang Khoa',
    role: 'Software Developer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: 3,
    rating: 5,
    title: 'Extremely clean and smart room',
    content:
      'The Sunset Panorama room in Phu Quoc was truly outstanding. I loved the convenience of the sound system and smart lighting that adjusts throughout the day.',
    name: 'Tran Thu Ha',
    role: 'Financial Consultant',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
  },
];

const CustomerFeedback = () => {
  return (
    <section className="bg-white border-t border-b border-brand-border py-20" id="feedbacks">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs text-brand-primary font-medium tracking-widest uppercase block mb-2">
            Guest Reviews
          </span>
          <h2 className="text-3xl font-medium text-brand-textHead">Real Stay Experiences</h2>
          <p className="text-sm text-brand-textBody mt-2">
            Read genuine reviews from guests who found peace and comfort with Hotelify.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {feedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="bg-brand-bg p-6 rounded-xl border border-brand-border flex flex-col justify-between hover:shadow-sm transition-shadow"
            >
              <div>
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: feedback.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-brand-textHead font-medium mb-1">&ldquo;{feedback.title}&rdquo;</p>
                <p className="text-xs text-brand-textBody leading-relaxed">{feedback.content}</p>
              </div>
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-brand-border">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                  <img
                    src={feedback.avatar}
                    alt={feedback.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://placehold.co/150x150/E2E8F0/64748B?text=${feedback.name.charAt(0)}`;
                    }}
                  />
                </div>
                <div>
                  <span className="text-xs font-medium text-brand-textHead block">{feedback.name}</span>
                  <span className="text-[10px] text-brand-textBody">{feedback.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerFeedback;
