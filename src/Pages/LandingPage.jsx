import HeroSection from "../Components/Patients/HeroSection";
import AboutSection from "../Components/Patients/AboutSection";
import ServicesSection from "../Components/Patients/ServicesSection";
import ContactSection from "../Components/Patients/ContactSection";

export default function LandingPage() {
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
      <section id="contact">
        <ContactSection />
      </section>
    </>
  );
} 