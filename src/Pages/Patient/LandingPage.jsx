import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HeroSection from "../../Components/Patients/HeroSection";
import AboutSection from "../../Components/Patients/AboutSection";
import ServicesSection from "../../Components/Patients/ServicesSection";
import VideoConsultationSection from "../../Components/Patients/VideoConsultationSection";
import DoctorsSection from "../../Components/Patients/DoctorsSection";
import ContactSection from "../../Components/Patients/ContactSection";

export default function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    // Handle scroll to section from navigation state or hash
    const targetSection = location.state?.scrollTo || location.hash;

    if (targetSection) {
      const scrollToSection = () => {
        const element = document.querySelector(targetSection);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return true;
        }
        return false;
      };

      // Try to scroll immediately
      if (!scrollToSection()) {
        // If element not found, retry with increasing delays
        const timeouts = [100, 300, 500, 1000];
        timeouts.forEach(delay => {
          setTimeout(() => {
            scrollToSection();
          }, delay);
        });
      }
    }
  }, [location.state, location.hash, location.pathname]);

  return (
    <>
      <section id="home">
        <HeroSection />
      </section>
      <section id="about">
        <AboutSection />
      </section>
      <section id="services">
        <ServicesSection />
      </section>
      <section id="video-consultation">
        <VideoConsultationSection />
      </section>
      <section id="doctors">
        <DoctorsSection />
      </section>
      <section id="contact">
        <ContactSection />
      </section>
    </>
  );
}